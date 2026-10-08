---
'@swissspidy/a2ui-wp': patch
---

Label long text fields: `TextareaControl` labels its own instance id, so the `id` a2ui-wp passed reached the textarea but not its label.
