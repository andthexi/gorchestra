#!/usr/bin/env bash
set -euo pipefail

case "${1-}" in
    setup|verify-isolation|cleanup) [[ $# == 1 ]] ;;
    run)
        [[ $# == 2 ]]
        case "$2" in
            check:dependencies|check:prepare|lint|format|typecheck|test|fallow:check|fallow:audit) ;;
            *) printf 'Unsupported root check\n' >&2; exit 2 ;;
        esac
        ;;
    *) printf 'Usage: ci-container.sh setup|verify-isolation|run CHECK|cleanup\n' >&2; exit 2 ;;
esac

: "${RUNNER_TEMP:?Missing RUNNER_TEMP}"
: "${GITHUB_RUN_ID:?Missing GITHUB_RUN_ID}"
: "${GITHUB_RUN_ATTEMPT:?Missing GITHUB_RUN_ATTEMPT}"
[[ "$RUNNER_TEMP" == /* && -d "$RUNNER_TEMP" && ! -L "$RUNNER_TEMP" ]]
[[ "$RUNNER_TEMP" != *','* && "$RUNNER_TEMP" != *':'* && "$RUNNER_TEMP" != *$'\n'* ]]
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]

readonly image='docker.io/library/node:24.22.3-bookworm@sha256:aca79828f8a4afc627f189387c965625bcc419233946210a3b9522d90a59b5c6'
readonly state="$RUNNER_TEMP/gorchestra-ci-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
readonly label='io.gorchestra.ci.owner'
export DOCKER_CONFIG="$state/docker-config"
owner=''

# Never consult a host credential configuration or an ambient remote daemon.
docker_local() {
    docker --host unix:///var/run/docker.sock "$@"
}

load_owner() {
    [[ -d "$state" && ! -L "$state" && -f "$state/owner" && ! -L "$state/owner" ]] || return 2
    IFS= read -r owner < "$state/owner" || return 2
    [[ "$owner" =~ ^[a-f0-9]{32}$ ]] || return 2
}

# Project output must not be interpreted as GitHub workflow commands.
replay_log() {
    local marker
    marker="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
    printf '::stop-commands::%s\n' "$marker"
    cat -- "$1"
    printf '\n::%s::\n' "$marker"
}

cleanup() {
    [[ -e "$state" ]] || return 0
    load_owner || return
    docker_local version --format '{{.Server.Version}}' >/dev/null || return
    local id present actual volume result=0
    if [[ -f "$state/containers" ]]; then
        while IFS= read -r id; do
            [[ "$id" =~ ^[a-f0-9]{64}$ ]] || return 2
            present="$(docker_local container ls -aq --no-trunc --filter "id=$id")" || return
            [[ -n "$present" ]] || continue
            actual="$(docker_local inspect --format "{{index .Config.Labels \"$label\"}}" "$id")" || return
            [[ "$actual" == "$owner" ]] || return 2
            docker_local container rm --force "$id" >/dev/null || result=$?
        done < "$state/containers"
    fi
    if [[ -f "$state/volumes" ]]; then
        while IFS= read -r volume; do
            case "$volume" in "gorchestra-ci-$owner-work"|"gorchestra-ci-$owner-reports") ;; *) return 2 ;; esac
            present="$(docker_local volume ls --format '{{.Name}}' --filter "name=^$volume$")" || return
            [[ -n "$present" ]] || continue
            actual="$(docker_local volume inspect --format "{{index .Labels \"$label\"}}" "$volume")" || return
            [[ "$actual" == "$owner" ]] || return 2
            docker_local volume rm "$volume" >/dev/null || result=$?
        done < "$state/volumes"
    fi
    return "$result"
}

# A fresh process/container for every step; only the disposable volumes persist.
run_container() {
    local network="$1" operation="$2" role="$3"
    shift 3
    local id status=0 actual mounts expected_mounts
    local bootstrap='mkdir -p "$HOME/config" "$HOME/cache" "$HOME/data"; exec "$@"'
    local -a identity=(--user 1000:1000)
    [[ "$network" == none || "$network" == bridge ]]
    [[ "$operation" =~ ^[a-z-]+$ ]]
    case "$role" in
        check) ;;
        initialize) identity=(--user 0:0 --cap-add CHOWN); bootstrap='exec "$@"' ;;
        *) return 2 ;;
    esac
    id="$(docker_local create \
        --name "gorchestra-ci-$owner-$operation" --label "$label=$owner" \
        --platform linux/amd64 --network "$network" \
        --cap-drop ALL "${identity[@]}" --security-opt no-new-privileges:true \
        --read-only --pids-limit 256 --cpus 2 --memory 10g --memory-swap 10g \
        --tmpfs /tmp:rw,nosuid,nodev,size=512m,mode=1777 \
        --tmpfs /home/ci:rw,nosuid,nodev,size=256m,uid=1000,gid=1000,mode=0700 \
        --mount "type=volume,source=gorchestra-ci-$owner-work,target=/work,volume-nocopy" \
        --mount "type=volume,source=gorchestra-ci-$owner-reports,target=/reports,volume-nocopy" \
        --mount "type=bind,source=$state/tools,target=/tools,readonly" \
        --mount "type=bind,source=$state/input,target=/input,readonly" \
        --workdir /work --entrypoint /usr/bin/env "$image" \
        -i PATH=/tools:/usr/local/bin:/usr/bin:/bin \
        HOME=/home/ci XDG_CONFIG_HOME=/home/ci/config XDG_CACHE_HOME=/home/ci/cache \
        XDG_DATA_HOME=/home/ci/data TMPDIR=/tmp TMP=/tmp TEMP=/tmp \
        CI=1 npm_config_userconfig=/dev/null GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 \
        GIT_TERMINAL_PROMPT=0 NUXT_TELEMETRY_DISABLED=1 FALLOW_TELEMETRY_DISABLED=1 \
        FALLOW_UPDATE_CHECK=0 DO_NOT_TRACK=1 VITEST_MAX_WORKERS=1 \
        NODE_OPTIONS=--max-old-space-size=4096 \
        /bin/bash -euc "$bootstrap" ci "$@")" || return
    [[ "$id" =~ ^[a-f0-9]{64}$ ]] || return 2
    printf '%s\n' "$id" >> "$state/containers"
    if [[ "$role" == check ]]; then
        actual="$(docker_local inspect --format '{{.Config.User}}|{{.HostConfig.Privileged}}|{{.HostConfig.ReadonlyRootfs}}|{{.HostConfig.NetworkMode}}|{{.HostConfig.CapDrop}}|{{len .HostConfig.CapAdd}}|{{len .HostConfig.PortBindings}}|{{.HostConfig.PublishAllPorts}}|{{len .HostConfig.Devices}}|{{.HostConfig.SecurityOpt}}|{{.HostConfig.PidMode}}' "$id")" || return
        [[ "$actual" == "1000:1000|false|true|$network|[ALL]|0|0|false|0|[no-new-privileges:true]|" ]] || {
            printf 'Container isolation settings differ from the required policy\n' >&2
            return 2
        }
        mounts="$(docker_local inspect --format '{{range .Mounts}}{{println .Destination .Type .RW}}{{end}}' "$id" | LC_ALL=C sort)" || return
        expected_mounts="$(printf '\n/input bind false\n/reports volume true\n/tools bind false\n/work volume true\n' | LC_ALL=C sort)"
        [[ "$mounts" == "$expected_mounts" ]] || {
            printf 'Unexpected container mounts\n' >&2
            return 2
        }
    fi
    docker_local start --attach "$id" > "$state/logs/$operation.log" 2>&1 || status=$?
    replay_log "$state/logs/$operation.log"
    actual="$(docker_local inspect --format '{{.State.ExitCode}}|{{.State.OOMKilled}}|{{.State.Status}}' "$id")" || return
    printf '%s: Docker status=%s, container exit/oom/state=%s\n' "$operation" "$status" "$actual"
    printf '%s\n' "$actual" > "$state/logs/$operation.status"
    [[ "$actual" =~ ^([0-9]+)\|(true|false)\|exited$ ]] || return 2
    if [[ "${BASH_REMATCH[2]}" == true ]]; then return 137; fi
    if (( status != 0 )); then return "$status"; fi
    return "${BASH_REMATCH[1]}"
}

case "$1" in
    setup)
        : "${GITHUB_WORKSPACE:?Missing GITHUB_WORKSPACE}"
        [[ ! -e "$state" && ! -L "$state" ]]
        mkdir -m 700 -- "$state"
        mkdir -- "$state/docker-config" "$state/tools" "$state/input" "$state/logs"
        chmod 755 -- "$state/tools" "$state/input"
        owner="$(python3 -c 'import secrets; print(secrets.token_hex(16))')"
        printf '%s\n' "$owner" > "$state/owner"
        : > "$state/containers"
        : > "$state/volumes"
        trap 'code=$?; trap - EXIT; if (( code != 0 )); then cleanup || printf "Partial setup cleanup failed\n" >&2; fi; exit "$code"' EXIT
        docker_local version --format '{{.Server.Version}}'
        [[ "$(docker_local info --format '{{.OSType}}|{{.Architecture}}')" == 'linux|x86_64' ]]
        python3 - <<'PY'
from pathlib import Path
available = int(next(line.split()[1] for line in Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:')))
if available < 12 * 1024 * 1024:
    raise SystemExit('CI requires at least 12 GiB available memory for the existing root check limits')
PY
        docker_local pull --platform linux/amd64 "$image"
        [[ "$(docker_local image inspect --format '{{.Os}}|{{.Architecture}}' "$image")" == 'linux|amd64' ]]
        curl --fail --silent --show-error --proto '=https' --tlsv1.2 --max-time 120 \
            'https://registry.npmjs.org/@pnpm/exe.linux-x64/-/exe.linux-x64-12.19.0.tgz' \
            --output "$state/pnpm.tgz"
        python3 - "$state" <<'PY'
from pathlib import Path
import base64
import hashlib
import io
import sys
import tarfile

state = Path(sys.argv[1])
archive = (state / 'pnpm.tgz').read_bytes()
expected = base64.b64decode('oTji4PzIwSG+AbcHnouo/hW1Oz+1yDP30KJqBmmQnxiOSqTAi8HylytTrONUT08DIjuZ9t8gGZWjv/tqnQdb2w==', validate=True)
if hashlib.sha512(archive).digest() != expected:
    raise SystemExit('Pinned pnpm archive integrity mismatch')
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
    members = tar.getmembers()
    expected_names = {'package/pnpm', 'package/package.json', 'package/LICENSE', 'package/THIRD-PARTY-NOTICES.md'}
    if {member.name for member in members} != expected_names or len(members) != len(expected_names):
        raise SystemExit('Unexpected pnpm archive members')
    if any(not member.isfile() for member in members):
        raise SystemExit('pnpm archive contains a non-regular member')
    stream = tar.extractfile('package/pnpm')
    if stream is None:
        raise SystemExit('Missing pnpm executable')
    destination = state / 'tools/pnpm'
    with destination.open('xb') as executable:
        executable.write(stream.read())
    destination.chmod(0o555)
PY
        head_commit="$(git -C "$GITHUB_WORKSPACE" rev-parse --verify 'HEAD^{commit}')"
        main_commit="$(git -C "$GITHUB_WORKSPACE" rev-parse --verify 'refs/remotes/origin/main^{commit}')"
        [[ "$head_commit" =~ ^[a-f0-9]{40}$ && "$main_commit" =~ ^[a-f0-9]{40}$ ]]
        printf '%s\n' "$head_commit" > "$state/head"
        printf '%s\n' "$main_commit" > "$state/main"
        git -C "$GITHUB_WORKSPACE" -c core.hooksPath=/dev/null bundle create "$state/input/source.bundle" HEAD refs/remotes/origin/main
        chmod 444 -- "$state/input/source.bundle"
        for suffix in work reports; do
            volume="gorchestra-ci-$owner-$suffix"
            existing="$(docker_local volume ls --format '{{.Name}}' --filter "name=^$volume$")"
            [[ -z "$existing" ]]
            printf '%s\n' "$volume" >> "$state/volumes"
            docker_local volume create --label "$label=$owner" "$volume" >/dev/null
        done
        run_container none initialize initialize /bin/chown 1000:1000 /work /reports
        run_container none checkout check /bin/bash -euc '
            [[ "$(node --version)" == v24.22.3 && "$(pnpm --version)" == 12.19.0 ]]
            git init /work
            git -c core.hooksPath=/dev/null fetch /input/source.bundle HEAD:refs/heads/ci-source refs/remotes/origin/main:refs/heads/main
            git -c core.hooksPath=/dev/null checkout --detach refs/heads/ci-source
            [[ "$(git rev-parse HEAD)" == "$1" && "$(git rev-parse main)" == "$2" ]]
        ' ci "$head_commit" "$main_commit"
        run_container bridge install check pnpm --npmrc-auth-file=/dev/null install \
            --frozen-lockfile --ignore-scripts --ignore-pnpmfile --no-runtime --registry=https://registry.npmjs.org
        : > "$state/installed"
        ;;
    verify-isolation)
        load_owner
        [[ -f "$state/installed" ]]
        run_container none isolation check node --input-type=module -e '
            import assert from "node:assert/strict";
            import fs from "node:fs";
            import net from "node:net";
            import os from "node:os";
            import { once } from "node:events";
            assert.equal(process.getuid(), 1000);
            const interfaces = os.networkInterfaces();
            assert.ok(interfaces.lo?.some(entry => entry.address === "127.0.0.1"));
            assert.ok(Object.values(interfaces).flat().every(entry => entry.internal));
            assert.ok(!fs.readFileSync("/proc/net/route", "utf8").split("\n").slice(1).some(line => line.trim() && line.trim().split(/\s+/)[1] === "00000000"));
            for (const path of ["/tools/isolation-write", "/usr/local/isolation-write"]) {
                assert.throws(() => fs.writeFileSync(path, "probe", { flag: "wx" }), error => ["EACCES", "EROFS"].includes(error.code));
            }
            const server = net.createServer(socket => socket.end("loopback"));
            server.listen(0, "127.0.0.1");
            await once(server, "listening");
            const client = net.connect(server.address().port, "127.0.0.1");
            let response = "";
            client.setEncoding("utf8");
            client.on("data", data => { response += data; });
            await once(client, "end");
            await new Promise(resolve => server.close(resolve));
            assert.equal(response, "loopback");
            await new Promise((resolve, reject) => {
                const socket = net.connect({ host: "192.0.2.1", port: 9 });
                socket.setTimeout(1000, () => { socket.destroy(); reject(new Error("Egress denial was not immediate")); });
                socket.once("connect", () => { socket.destroy(); reject(new Error("Unexpected egress")); });
                socket.once("error", error => {
                    socket.destroy();
                    if (["ENETUNREACH", "EHOSTUNREACH"].includes(error.code)) resolve();
                    else reject(error);
                });
            });
            process.stdout.write("Verified uid, read-only mounts, isolated loopback and denied egress\n");
        '
        : > "$state/isolation-verified"
        ;;
    run)
        load_owner
        [[ -f "$state/installed" && -f "$state/isolation-verified" ]]
        check="$2"
        if [[ "$check" != check:dependencies ]]; then [[ -f "$state/dependencies-passed" ]]; fi
        case "$check" in
            lint|typecheck|test|fallow:check|fallow:audit) [[ -f "$state/preparation-passed" ]] ;;
        esac
        IFS= read -r head_commit < "$state/head"
        IFS= read -r main_commit < "$state/main"
        [[ "$head_commit" =~ ^[a-f0-9]{40}$ && "$main_commit" =~ ^[a-f0-9]{40}$ ]]
        run_container none "${check//:/-}" check /bin/bash -euc '
            [[ "$(node --version)" == v24.22.3 && "$(pnpm --version)" == 12.19.0 ]]
            [[ "$(git rev-parse HEAD)" == "$1" && "$(git rev-parse main)" == "$2" ]]
            exec pnpm --npmrc-auth-file=/dev/null run "$3"
        ' ci "$head_commit" "$main_commit" "$check"
        case "$check" in
            check:dependencies) : > "$state/dependencies-passed" ;;
            check:prepare) : > "$state/preparation-passed" ;;
        esac
        ;;
    cleanup) cleanup ;;
esac
