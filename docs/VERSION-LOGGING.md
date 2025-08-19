# Version Logging & Release Process

This document outlines the standardized process for version updates, changelog creation, and release management in SPACE Terminal.

## Version Numbering

SPACE Terminal follows semantic versioning (SemVer) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR** (0.x.x): Breaking changes, major architectural shifts
- **MINOR** (x.X.x): New features, significant enhancements, UI overhauls
- **PATCH** (x.x.X): Bug fixes, minor improvements, security patches

### Current Version Pattern
- **v0.2.x**: Pre-1.0 development phase focusing on core features
- Target **v1.0.0**: First stable release with complete feature set

## Files to Update for Each Release

### 1. Version Number Updates
Update version in these files:

```bash
package.json                     # "version": "0.2.X"
src/components/InfoModal.jsx     # Version display and description
src/components/ImportExportModal.jsx  # appVersion in export data
```

### 2. Create New Changelog
Create `docs/CHANGELOG-v0.2.X.md` following the standard template.

### 3. Update InfoModal Content
Update the changelog content displayed in the Info modal.

## Changelog Template

```markdown
# SPACE Terminal v0.2.X Changelog

## Major Features
### Feature Name
- **Key capability** with brief description
- **Another capability** with implementation details

## Technical Enhancements
### Category Name
- **Enhancement 1** - description
- **Enhancement 2** - description

## Bug Fixes
- **Issue description** - how it was resolved
- **Another fix** - technical details

## UI/UX Improvements
- **Interface improvement** - user impact
- **Design enhancement** - visual changes

---

**Total Changes:** X major features • X technical enhancements • X bug fixes • X UI improvements

Version 0.2.X focuses on [main theme/purpose of release].
```

## Step-by-Step Release Process

### 1. Prepare Release Branch
```bash
git checkout main
git pull origin main
git checkout -b release/v0.2.X
```

### 2. Update Version Numbers
- Update `package.json` version
- Update `InfoModal.jsx` version and description
- Update `ImportExportModal.jsx` appVersion
- Update totals in InfoModal summary

### 3. Create Changelog
- Create new `docs/CHANGELOG-v0.2.X.md`
- Follow the standard template structure
- Categorize changes appropriately
- Include technical details and user impact

### 4. Update InfoModal Content
Replace the changelog content in `InfoModal.jsx` with highlights from the new version:

```jsx
<h3 className="text-green-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.X</h3>
<p className="text-gray-600 dark:text-gray-300 text-sm">
  Version 0.2.X [brief description of main focus].
</p>
```

### 5. Test & Build
```bash
npm run build          # Test production build
npm run test          # Run test suite
npm run dev:watch     # Test development mode
```

### 6. Commit & Push
```bash
git add .
git commit -m "chore: Release v0.2.X

- Update version numbers across codebase
- Add comprehensive changelog
- Update InfoModal with release highlights
- [List major changes]"

git push origin release/v0.2.X
```

### 7. Create Pull Request
- Create PR from `release/v0.2.X` to `main`
- Use changelog content for PR description
- Include testing notes and breaking changes
- Tag reviewers if applicable

### 8. Post-Release
After merge:
```bash
git tag v0.2.X
git push origin v0.2.X
```

## Changelog Categories

### Major Features
- New core functionality
- Significant user-facing capabilities
- Major architectural additions

### Technical Enhancements
- Backend improvements
- Performance optimizations
- Code quality improvements
- Build/deployment enhancements

### Bug Fixes
- Issue resolutions
- Error handling improvements
- Edge case fixes

### UI/UX Improvements
- Interface enhancements
- Design improvements
- Accessibility updates
- Mobile optimizations

## Writing Guidelines

### Changelog Entries
- **Start with action verbs**: "Add", "Fix", "Improve", "Update"
- **Be specific**: Include technical details where relevant
- **Focus on user impact**: Explain what users will experience
- **Use consistent formatting**: Bold key terms, consistent punctuation

### Version Descriptions
- **Concise summary**: 1-2 sentences max
- **Highlight main theme**: What is this release primarily about?
- **User-focused**: Emphasize benefits to end users

### Commit Messages
- **Follow conventional commits**: `feat:`, `fix:`, `chore:`
- **Include scope**: `feat(mobile):`, `fix(auth):`
- **Descriptive body**: Multi-line for complex changes

## Version History Reference

- **v0.2.0**: Initial evaluation system
- **v0.2.1**: Session management improvements
- **v0.2.2**: Authentication system integration
- **v0.2.3**: Input UX improvements
- **v0.2.4**: Evaluation capabilities and streaming
- **v0.2.5**: Mobile touch scrolling fixes
- **v0.2.6**: Mobile responsive design + OpenRouter integration

## Tools & Automation

### Helpful Commands
```bash
# Check version consistency
grep -r "0\.2\." src/ docs/ package.json

# Find changelog references
ls docs/CHANGELOG-*.md

# Build and test
npm run build && npm run test
```

### Future Automation Ideas
- Automated version bumping scripts
- Changelog generation from commit messages
- Release notes automation
- Version consistency checking

## Best Practices

1. **Plan releases around themes** - group related features
2. **Test thoroughly** - both dev and production builds
3. **Update documentation** - keep README and setup docs current
4. **Communicate changes** - clear descriptions for users
5. **Maintain backwards compatibility** - note breaking changes clearly
6. **Archive old versions** - keep historical record accessible

---

This process ensures consistent, well-documented releases that help users understand changes and maintain development momentum.
