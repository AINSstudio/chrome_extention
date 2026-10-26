# AINS Studio Glasswing for CHROME v5.0.1

**Codename: Glasswing**

## v5.0.1 update

This patch makes the Excel assistant approval countdown use a persisted absolute deadline. If the browser throttles the AINS page while its window is in the background, the deadline is not reset. When the page gets execution time again, the countdown reflects the elapsed time and continues. Reloading during the approval prompt also restores the existing deadline.

This update is included in the CHROME package. Browsers and operating systems can suspend background pages, so code cannot run while the browser is closed or the device is asleep; the page resumes when the browser schedules it again.

## Update steps

Reload or update the extension in CHROME, then refresh the AINS tab. See the browser-specific README for development setup. Store submission and signing are not performed by this local package.

## Package

Download `ains-studio-glasswing-chrome-v5.0.1.zip` from `release-assets`. The ZIP contains extension source files only.
