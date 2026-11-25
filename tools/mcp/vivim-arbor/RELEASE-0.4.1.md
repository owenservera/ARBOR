# VIVIM ARBOR 0.4.1 — authorization support package

Source: ARBOR `7988542220191d9b2784d19da053e407607e87ee`, `tools/mcp/vivim-arbor`.

Packages four previously committed support modules (grant verification, local policy, loopback HTTP, and read-only stdio profile), the identical Host discovery dependency, and five canonical regression files. All ten source/test blobs matched canonical GitHub. Node v22.16.0 cloud regression: 27/27 passed.

This is a private package-only update. Existing MCP configuration and the operations/Commander runtime are unchanged. New modules are not registered or automatically started. The separate secure tunnel app and Windows process are not updated by this release. No new issuer, credentials, remote tool permissions, listener, or effect authority are configured. Actual Windows installation, real OAuth and live Host acceptance remain pending.
