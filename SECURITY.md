# Security Policy

## Supported versions

YouTube Plus is a client-side userscript distributed through its userscript
manager, which updates it from `main`. Only the latest release is supported.

| Version | Supported |
|---|---|
| Latest release (`0.2.x` on `main`) | Yes |
| Older releases | No |

## Reporting a vulnerability

Please report suspected vulnerabilities **privately**. Do not open a public
issue, pull request or discussion with exploit details.

Preferred channel: GitHub private vulnerability reporting —
[Security → Report a vulnerability](https://github.com/NemoKing1210/youtube-plus/security/advisories/new).
If the form is unavailable, open a short public issue asking for a private
channel without disclosing the details.

Include in the report:

- the affected script version (the `@version` in the installed userscript) and
  the userscript manager;
- browser and operating system;
- a minimal reproduction: steps, page, settings involved and the expected vs
  actual result;
- impact and a harmless proof of concept;
- whether the issue is already public or was reported elsewhere.

We aim to acknowledge a report within 7 days and to give an initial assessment
within 30 days. These are best-effort targets for a volunteer project. We will
keep you informed while a fix is prepared and ask for a reasonable window
(typically 90 days) before public disclosure. Reporters are credited in the
advisory unless they prefer to remain anonymous.

This project has no bug bounty.

## Scope

In scope:

- escaping the generated stylesheet or settings UI through custom selectors,
  imported settings or a crafted backup (`{`, `}`, `;`, `@`, comments, etc.);
- script injection (XSS) in the settings dialog, guide row, toasts or other
  UI;
- prototype pollution or unsafe deserialization in settings import;
- leaking browsing data, credentials or settings to a third party, or adding
  network requests without an explicit feature and disclosure;
- tampering with the committed build artifacts or the CI/release path.

Out of scope:

- vulnerabilities in YouTube or Google products (report them to Google);
- bugs that only hide or show interface elements without a security impact;
- issues that require a malicious userscript manager, a compromised browser
  or an already-installed malicious extension;
- risks from pasting attacker-supplied code into DevTools or the settings
  yourself (self-XSS);
- unsupported browsers and outdated userscript managers.

## Safe research

Test only against your own account and data. Do not access other people's
accounts, run denial-of-service tests against YouTube, or publish details
before a fix is available.
