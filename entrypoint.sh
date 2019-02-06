#!/bin/bash
set -e

# copied directly from:
# https://github.com/actions/npm/blob/98e6dc1/entrypoint.sh#L5-L13
if [ -n "$NPM_AUTH_TOKEN" ]; then
  # Respect NPM_CONFIG_USERCONFIG if it is provided, default to $HOME/.npmrc
  NPM_CONFIG_USERCONFIG="${NPM_CONFIG_USERCONFIG-"$HOME/.npmrc"}"
  NPM_REGISTRY_URL="${NPM_REGISTRY_URL-registry.npmjs.org}"

  # Allow registry.npmjs.org to be overridden with an environment variable
  printf "//%s/:_authToken=%s\\nregistry=%s" "$NPM_REGISTRY_URL" "$NPM_AUTH_TOKEN" "$NPM_REGISTRY_URL" > "$NPM_CONFIG_USERCONFIG"
  chmod 0600 "$NPM_CONFIG_USERCONFIG"
fi

# configure git with sensible defaults
git config --global user.email "${GIT_USER_EMAIL:-$(jq -r .pusher.email $GITHUB_EVENT_PATH)}"
git config --global user.name "${GIT_USER_NAME:-$(jq -r .pusher.name $GITHUB_EVENT_PATH)}"
# then print out our config
git config --list

sh -c "/primer-publish/cli.js $*"
