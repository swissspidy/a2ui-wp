# Changesets

Every pull request that changes `@swissspidy/a2ui-wp` adds a changeset: run `npm run changeset`, pick the bump, and describe the change for the changelog. The plugin itself is not released through Changesets.

When changesets land on `main`, the release workflow opens or updates a "Version packages" pull request. Merging it publishes the new version to npm.
