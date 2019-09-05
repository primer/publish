# primer/publish

This [GitHub Action][github actions] publishes to npm with the following conventions:

1. If we're on the `master` branch, the `version` field is used as-is and we just run `npm publish --access public`.
   - After publishing a new version on the `master` branch, we tag the commit SHA with `v{version}` via the GitHub API.
   - If the version in `package.json` is already published, we exit with a `78` code, which is Actions-speak for "neutral".
1. If we're on a `release-<version>` branch, we publish a release candidate to the `next` npm dist-tag with the version in the form: `<version>-rc.<sha>`.
   - A [status check][status checks] is created with the context `npm version` noting whether the `version` field in `package.json` matches the `<version>` portion of the branch. If it doesn't, the check's status is marked as pending.
1. Otherwise, we publish a "canary" release, which has a version in the form: `0.0.0-<sha>`.

## Status checks

Depending on the branch, a series of [statuses][status checks] will be created by this action in your checks: **publish** is the action's check, and **publish {package-name}** is a [commit status] created by the action that reports the version published and links to `unpkg.com` via "Details":

![image](https://user-images.githubusercontent.com/113896/52375286-23368980-2a14-11e9-8974-062a3e45a846.png)

If you're on a release branch (`release-<version>`) and the `<version>` portion of the branch name doesn't match the `version` field in `package.json`, you'll get a pending status reminding you to update it:

![image](https://user-images.githubusercontent.com/113896/52388530-b63ae800-2a43-11e9-92ef-14ec9459c109.png)

## Usage

**You will need to provide an npm access token with publish permissions via the `NPM_AUTH_TOKEN` secret in the Actions visual editor** if you haven't already. The `GITHUB_TOKEN` secret is also required to create tags after releasing on the master branch.

We suggest that you place this action after any linting and/or testing actions to catch as many errors as possible before publishing.


### Actions v2
To use this in an [Actions v2](https://help.github.com/en/articles/migrating-github-actions-from-hcl-syntax-to-yaml-syntax) workflow, add the following YAML to one or more of your steps:

```yaml
- uses: primer/publish@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}
```

You can pass additional [options](#options) via the `args` key:

```diff
​- uses: primer/publish@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}
+   args: '--dry-run -- --unsafe-perm'
```

### Actions v1
To use this in an Actions v1 workflow, add the following snippet to `.github/main.workflow`:

```hcl
action "publish" {
  uses = "primer/publish@master"
  secrets = [
    "GITHUB_TOKEN",
    "NPM_AUTH_TOKEN",
  ]
}
```

## Options

### `--dry-run`

Default: `false`

Does everything publish would do except actually publishing to the registry. Reports the details of what would have been published.

#### Example

```hcl
action "publish" {
  uses = "primer/publish@master"
  secrets = ["GITHUB_TOKEN", "NPM_AUTH_TOKEN"]
  args = "--dry-run"
}
```

### `--dir=<path>`

Default: `.`

Accepts a path to the directory that contains the `package.json` to publish.

#### Example

```hcl
action "publish" {
  uses = "primer/publish@master"
  secrets = ["GITHUB_TOKEN", "NPM_AUTH_TOKEN"]
  args = "--dir=packages/example"
}
```

## npm CLI arguments

It's possible to pass additional arguments to `npm` via the `args` field in your workflow action. Because the `primer-publish` CLI accepts options of its own (such as `--dry-run`), you need to prefix any `npm` arguments with `--`:

```diff
action "publish" {
  uses = "primer/publish@master"
+  args = ["--", "--registry=https://registry.your.org"]
```

[github actions]: https://github.com/features/actions
[commit status]: https://developer.github.com/v3/repos/statuses/
[status checks]: https://help.github.com/articles/about-status-checks/
