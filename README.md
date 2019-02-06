# primer/publish

This [GitHub Action][github actions] publishes to npm with the following conventions:

1. If we're on the `master` branch, the `version` field is used as-is and we just run `npm publish --access public`.
1. If we're on a `release-<version>` branch, we publish a release candidate to the `next` npm dist-tag with the version in the form: `<version>-rc.<sha>`
1. Otherwise, we publish a "canary" release, which has a version in the form: `0.0.0-<sha>`.

## Status checks
Two [status checks] will be listed for this action in your checks: **publish** is the action's check, and **publish {package-name}** is a [commit status] created by the action that reports the version published and links to `unpkg.com` via "Details":

![image](https://user-images.githubusercontent.com/113896/52375286-23368980-2a14-11e9-8974-062a3e45a846.png)

## Usage
To use this action in your own workflow, add the following snippet to your `.github/main.workflow` file:

```hcl
action "publish" {
  uses = "primer/publish@master"
  secrets = [
    "GITHUB_TOKEN",
    "NPM_AUTH_TOKEN",
  ]
}
```

**You will need to provide an npm access token with publish permissions via the `NPM_AUTH_TOKEN` secret in the Actions visual editor** if you haven't already.

To avoid racking up failed publish actions, we suggest that you place this action after any linting and test actions.

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
