# Changelog

All notable changes to `@yagas-cat/nestjs-auth` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-27

### Added
- **Initial Release**: Complete authentication and authorization package for NestJS
- **JWT Token Validation**: Full JWT introspection support with caching
- **Role-Based Access Control**: Flexible RBAC with any/all matching modes
- **Permission-Based Access Control**: Context-aware permission checking
- **Declarative Guards**: Clean decorator-based API for authorization
- **Comprehensive Testing**: Full Jest test suite with 100% coverage
- **TypeScript Support**: Complete type definitions and ESM/CommonJS builds
- **Documentation**: Extensive README with examples and API reference

### Features
- Token extraction from Authorization header or cookies
- Automatic user context injection into request object
- Configurable external auth service URLs
- Development mode with disabled caching for easier debugging
- Proper error handling with appropriate HTTP status codes
- Support for organization, workspace, and object-level context

### Technical Details
- Built with TypeScript 5.2+
- Compatible with NestJS 10+
- Uses Rollup for optimized bundle generation
- Includes both ESM and CommonJS builds
- Zero runtime dependencies (peer dependencies only)

### Breaking Changes
- None (initial release)

### Dependencies
- **Peer Dependencies**: `@nestjs/common@^10.0.0`, `@nestjs/core@^10.0.0`, `@nestjs/axios@^3.0.0`, `@nestjs/platform-express@^10.0.0`, `reflect-metadata@^0.1.13`, `rxjs@^7.8.1`

## [Unreleased]

### Planned
- Custom token extractor interfaces
- Additional guard composition options
- Performance optimizations
- Extended context support
- Integration examples for popular auth providers

---

## Version History

### Development
- **0.1.0-alpha**: Internal development version
- **0.2.0-alpha**: Added basic guard implementations
- **0.3.0-alpha**: Integrated permission and role checking
- **0.4.0-alpha**: Added comprehensive test coverage
- **0.5.0-alpha**: Build system and packaging setup
- **1.0.0-rc.1**: Release candidate with documentation

### Release Notes
- **1.0.0**: Production-ready release with full feature set

---

## Migration Guide

### From 0.x to 1.0.0
No migration needed - this is the initial stable release.

### Future Versions
- **2.0.0**: Planned major release with breaking changes (if any)
- **1.x.x**: Minor releases with new features and bug fixes

---

## Contributing to Changelog
When contributing to this project, please:
1. Add changes to the "Unreleased" section
2. Follow the format: `### Added|Changed|Deprecated|Removed|Fixed|Security`
3. Use present tense for changes
4. Reference issue/PR numbers when applicable

Example:
```
### Added
- New feature description ([#123](https://github.com/your-org/nestjs-auth/pull/123))

### Fixed
- Bug fix description ([#124](https://github.com/your-org/nestjs-auth/issues/124))
```

---

For more information about this package, see [README.md](README.md).