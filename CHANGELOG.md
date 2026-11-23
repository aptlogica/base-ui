# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Initial open-source hygiene files added.

### Added
- Developer > Overview has a **Base management API** switch (owners and co-owners) that turns the schema write APIs on or off for a base.
- API docs page documents the base management endpoints: manage tables, columns, constraints and the primary key, with request and response examples, and the new error codes (`forbidden`, `feature_disabled`, `system_column`, `in_use`, `conversion_not_allowed`, `type_not_supported`, `unavailable`).
- Import success summary now supports downloading the import log directly from inline response content (`error_rows_file_content`) as a `.txt` file.
- Import preview now displays filtered row counts so cleanup-option impact is visible immediately.

### Changed
- Import success UI now reflects backend `import_stats` values from the latest import response contract.

### Fixed
- Clearing a Formula field and saving now updates the view correctly.
- TRY ME onboarding table-name step now allows re-focusing the input after blur.
- Table deletion flow now avoids navigating when the delete API request fails (for example, forbidden responses).
- Import review preview rendering is more consistent with cleanup toggles for empty/duplicate rows.