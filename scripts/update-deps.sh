#!/usr/bin/env bash
# Update Composer and npm dependencies to current stable releases.
# Usage: ./scripts/update-deps.sh [--minor|--major] [--dry-run] [--skip-tests] [--force]
#        [--composer-only|--npm-only]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="minor"
DRY_RUN=0
SKIP_POST_TESTS=0
FORCE=0
DO_COMPOSER=1
DO_NPM=1
DID_MAJOR=0
TARGET_LARAVEL_MAJOR=13
TARGET_PHP_MAJOR=8
TARGET_PHP_MINOR=3
# Packages pinned for peer/backend compatibility; bump manually after review.
#   typescript: typescript-eslint supports <6.1. eslint/@eslint/js: eslint-plugin-react supports <=9.
#   @types/node: track the Node major in use (24). @inertiajs/react: must match inertia-laravel major.
NCU_REJECT='typescript,@inertiajs/react,eslint,@eslint/js,vite,laravel-vite-plugin,@types/node'

usage() {
    cat <<'EOF'
Usage: ./scripts/update-deps.sh [options]

Options:
  --minor           Update within existing constraints (default)
  --major           Bump constraints to latest stable (incl. Laravel major)
  --dry-run         Clean-tree check + report only (no writes, no tests)
  --skip-tests      Skip post-update tests (baseline preflight still runs)
  --force           Skip clean-tree and baseline preflight (dangerous)
  --composer-only   Only Composer path (baseline/post tests: PHPUnit only)
  --npm-only        Only npm path (baseline/post tests: Vitest only)
  -h, --help        Show this help
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --minor) MODE="minor" ;;
        --major) MODE="major" ;;
        --dry-run) DRY_RUN=1 ;;
        --skip-tests) SKIP_POST_TESTS=1 ;;
        --force) FORCE=1 ;;
        --composer-only) DO_NPM=0; DO_COMPOSER=1 ;;
        --npm-only) DO_COMPOSER=0; DO_NPM=1 ;;
        -h|--help) usage; exit 0 ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
    shift
done

if [[ "$DO_COMPOSER" -eq 0 && "$DO_NPM" -eq 0 ]]; then
    echo "Nothing to do: both composer and npm disabled." >&2
    exit 1
fi

log() { printf '%s\n' "$*"; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "'$1' is required but not found in PATH"
}

php_version_ok() {
    php -r "exit(version_compare(PHP_VERSION, '${TARGET_PHP_MAJOR}.${TARGET_PHP_MINOR}.0', '>=') ? 0 : 1);"
}

current_laravel_major() {
    php -r '
        $lock = json_decode(file_get_contents("composer.lock"), true);
        foreach (array_merge($lock["packages"] ?? [], $lock["packages-dev"] ?? []) as $pkg) {
            if (($pkg["name"] ?? "") === "laravel/framework") {
                if (preg_match("/^v?(\d+)/", $pkg["version"] ?? "", $m)) {
                    echo $m[1];
                    exit(0);
                }
            }
        }
        exit(1);
    '
}

latest_laravel_stable_major() {
    # Packagist package metadata; take major from first non-dev, non-RC version.
    php -r '
        $json = @file_get_contents("https://repo.packagist.org/p2/laravel/framework.json");
        if ($json === false) {
            fwrite(STDERR, "Failed to fetch Packagist metadata for laravel/framework\n");
            exit(1);
        }
        $data = json_decode($json, true);
        $packages = $data["packages"]["laravel/framework"] ?? [];
        foreach ($packages as $pkg) {
            $v = $pkg["version"] ?? "";
            if ($v === "" || str_contains($v, "dev") || str_contains($v, "RC") || str_contains($v, "alpha") || str_contains($v, "beta")) {
                continue;
            }
            if (preg_match("/^v?(\d+)\./", $v, $m)) {
                echo $m[1];
                exit(0);
            }
        }
        fwrite(STDERR, "Could not determine latest stable laravel/framework major\n");
        exit(1);
    '
}

bump_composer_json_for_laravel_major() {
    local major="$1"
    php -r '
        $major = (int) $argv[1];
        $path = "composer.json";
        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if ($major === 13) {
            $data["require"]["php"] = "^8.3";
            $data["require"]["laravel/framework"] = "^13.0";
            if (isset($data["require"]["laravel/tinker"])) {
                $data["require"]["laravel/tinker"] = "^3.0";
            }
            if (isset($data["require-dev"]["phpunit/phpunit"])) {
                $data["require-dev"]["phpunit/phpunit"] = "^12.0";
            }
        } else {
            fwrite(STDERR, "No automated constraint map for Laravel major {$major}; update composer.json manually.\n");
            exit(1);
        }

        file_put_contents(
            $path,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
        );
    ' "$major"
}

check_clean_tree() {
    local status
    status="$(git status --porcelain)"
    if [[ -n "$status" ]]; then
        echo "Working tree is not clean (modified, staged, or untracked files):" >&2
        echo "$status" >&2
        echo "Commit, stash, or clean first so the update diff is reviewable. Use --force to override." >&2
        exit 1
    fi
}

run_baseline_tests() {
    if [[ "$DO_COMPOSER" -eq 1 ]]; then
        log "==> Baseline: composer test"
        composer test
    fi
    if [[ "$DO_NPM" -eq 1 ]]; then
        log "==> Baseline: npm run test:run"
        npm run test:run
    fi
}

run_post_tests() {
    if [[ "$SKIP_POST_TESTS" -eq 1 ]]; then
        log "==> Skipping post-update tests (--skip-tests)"
        return 0
    fi
    if [[ "$DO_COMPOSER" -eq 1 ]]; then
        log "==> Post-update: composer test"
        composer test
    fi
    if [[ "$DO_NPM" -eq 1 ]]; then
        log "==> Post-update: npm run test:run"
        npm run test:run
    fi
}

print_major_checklist() {
    local major="$1"
    cat <<EOF

==> Major upgrade checklist (Laravel ${major})
  - Review: https://laravel.com/docs/${major}.x/upgrade
  - Confirm config/cache.php has serializable_classes (default false)
  - Prefer PreventRequestForgery over VerifyCsrfToken aliases
  - Pin CACHE_PREFIX / SESSION_COOKIE / REDIS_PREFIX in .env if you rely on old defaults
  - Run full manual smoke test before deploying
EOF
}

# --- preflight ---
require_cmd git
[[ "$DO_COMPOSER" -eq 1 ]] && require_cmd composer && require_cmd php
[[ "$DO_NPM" -eq 1 ]] && require_cmd npm && require_cmd npx

if [[ "$FORCE" -eq 0 ]]; then
    log "==> Preflight: clean git working tree"
    check_clean_tree
else
    log "==> WARNING: --force enabled; skipping clean-tree check"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
    log "==> Dry-run (no writes, no tests)"
    if [[ "$DO_COMPOSER" -eq 1 ]]; then
        log "==> composer outdated"
        composer outdated --direct || true
        if [[ "$MODE" == "major" ]]; then
            current="$(current_laravel_major || echo unknown)"
            latest="$(latest_laravel_stable_major || echo unknown)"
            log "Laravel framework major: installed=${current} latest_stable=${latest}"
            if [[ "$current" != "unknown" && "$latest" != "unknown" && "$latest" -gt "$current" ]]; then
                log "Would bump first-party constraints for Laravel ${latest} and run composer update"
            else
                log "Would run composer update (no Laravel major bump detected)"
            fi
        else
            log "Would run: composer update"
        fi
    fi
    if [[ "$DO_NPM" -eq 1 ]]; then
        log "==> npm-check-updates (report)"
        if [[ "$MODE" == "major" ]]; then
            npx --yes npm-check-updates --reject "$NCU_REJECT"
            log "Would run: npx npm-check-updates -u --target latest --reject <pinned> && npm install"
        else
            npx --yes npm-check-updates --target minor || true
            log "Would run: npm update"
        fi
    fi
    log "==> Dry-run complete"
    exit 0
fi

if [[ "$FORCE" -eq 0 ]]; then
    run_baseline_tests
else
    log "==> WARNING: --force enabled; skipping baseline tests"
fi

# --- updates ---
if [[ "$DO_COMPOSER" -eq 1 ]]; then
    if [[ "$MODE" == "major" ]]; then
        if ! php_version_ok; then
            die "PHP ${TARGET_PHP_MAJOR}.${TARGET_PHP_MINOR}+ required for Laravel ${TARGET_LARAVEL_MAJOR} (running $(php -r 'echo PHP_VERSION;'))"
        fi

        current="$(current_laravel_major)" || die "Could not read laravel/framework version from composer.lock"
        latest="$(latest_laravel_stable_major)" || die "Could not resolve latest stable laravel/framework major"

        log "Laravel framework major: installed=${current} latest_stable=${latest}"

        if [[ "$latest" -gt "$current" ]]; then
            if [[ "$latest" -ne "$TARGET_LARAVEL_MAJOR" ]]; then
                die "Latest stable Laravel major is ${latest}; this script only auto-bumps to ${TARGET_LARAVEL_MAJOR}. Update the script map or bump composer.json manually."
            fi
            log "==> Bumping composer.json for Laravel ${latest}"
            bump_composer_json_for_laravel_major "$latest"
            DID_MAJOR=1
        fi
    fi

    log "==> composer update"
    composer update --no-interaction
    log "==> php artisan optimize:clear"
    php artisan optimize:clear
fi

# Packages pinned to stay peer/backend-compatible; bump manually after reviewing upgrade notes.
if [[ "$DO_NPM" -eq 1 ]]; then
    if [[ "$MODE" == "major" ]]; then
        log "==> npm-check-updates -u (latest stable; rejecting stack-pinned packages)"
        npx --yes npm-check-updates -u --target latest --reject "$NCU_REJECT"
        log "==> npm install"
        npm install
    else
        log "==> npm update"
        npm update
    fi
fi

run_post_tests

if [[ "$DID_MAJOR" -eq 1 ]]; then
    print_major_checklist "$TARGET_LARAVEL_MAJOR"
fi

log "==> Done"
