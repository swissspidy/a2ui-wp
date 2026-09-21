=== A2UI for WordPress ===

Contributors:      swissspidy
Tags:              ai, agents, a2ui, components, admin
Requires at least: 6.8
Tested up to:      6.8
Requires PHP:      8.0
Stable tag:        0.1.0
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

Renders agent-generated A2UI surfaces inside wp-admin with the WordPress component library.

== Description ==

[A2UI](https://a2ui.org/) is a protocol that lets an AI agent describe a user interface as a flat, streamable JSON structure that the host renders with its own native components. This plugin is the WordPress host: it takes A2UI messages and renders them with the same components wp-admin and the block editor use, so agent-generated UI looks and behaves like the rest of the admin.

The plugin adds an **A2UI** page under **Tools** with a playground: pick one of the bundled example streams, or paste your own, and render it. Every action the rendered UI would send back to an agent is shown in a log.

This is a proof of concept. It ships no agent of its own; the plan is to connect the renderer to agents running inside WordPress through the AI Client.

== Frequently Asked Questions ==

= Which A2UI version is supported? =

The basic catalog of A2UI v0.9.1. Messages tagged v0.9 are accepted too.

= Does this talk to an agent? =

Not yet. The playground renders bundled and pasted message streams. The renderer itself is transport-agnostic and takes a complete list of messages per turn, which is what a REST round-trip returns, so no streaming support on the host is required.

== Changelog ==

= 0.1.0 =

* Initial release.
