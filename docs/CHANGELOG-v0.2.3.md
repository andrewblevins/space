# SPACE Terminal v0.2.3 - Input Experience Enhancement

## Overview
This release focuses on improving the conversation input experience to encourage more thoughtful, detailed user messages that lead to richer AI responses.

## Key Changes

### Enhanced Input Interface
- **Enter Behavior**: Enter key now creates new lines instead of submitting, encouraging longer, more detailed messages
- **Keyboard Shortcuts**: ⌘+Enter (Mac) / Ctrl+Enter (Windows/Linux) to submit messages
- **Submit Button**: New prominent submit button displaying platform-appropriate keyboard shortcut
- **Visual Design**: Submit button integrates with terminal aesthetic while being satisfying to interact with
- **Auto-Detection**: Platform-specific shortcut display (⌘ on Mac, Ctrl on Windows/Linux)

### Intelligent Textarea Sizing
- **Larger Default Size**: Increased from 100px to 130px height (33% bigger)
- **Auto-Expand**: Automatically grows when typing past current height (up to 500px max)
- **Auto-Shrink**: Shrinks back when content is deleted or after sending messages
- **Manual Resize**: Draggable top border for user control with persistent sizing
- **Smart Coordination**: Auto-resize disabled during manual dragging to prevent conflicts

### Comprehensive File Upload System
- **Upload Methods**: Click paperclip icon or drag-and-drop files directly onto textarea
- **Visual Status**: Real-time upload indicators (uploading spinner → success checkmark → error warning)
- **File Preview**: Attached files display with appropriate icons (🖼️ images, 📄 PDFs, 📎 others)
- **Easy Removal**: Individual file removal with X button

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP (max 3.75MB) → Base64 encoded for Claude's vision capabilities
- **Documents**: PDF files (max 4.5MB, 100 pages) → Full document analysis with text and visual elements
- **Text Files**: TXT, MD, CSV, JSON, XML, HTML, JS, PY, CSS, SQL, YAML (max 4.5MB) → Content embedded as text
- **Smart Detection**: Validates both MIME types and file extensions for reliable file handling

### File Upload Error Handling
- **Client-Side Validation**: Immediate feedback on file size limits and unsupported formats
- **Server-Side Parsing**: Converts Claude API errors to user-friendly messages
- **Specific Guidance**: Clear error messages for common issues (PDF page limits, file size, unsupported types)
- **Visual Feedback**: ⚠️ warning icons with detailed error tooltips

### User Experience Improvements
- **Non-Disruptive**: Submit button maintains consistent appearance regardless of input state
- **Tactile Feedback**: Button provides satisfying click feedback with scale animation
- **Better Spacing**: Textarea padding adjusted to accommodate new submit button
- **Accessibility**: Proper focus states and keyboard navigation maintained
- **Drag & Drop**: Intuitive file attachment with visual feedback

## Design Philosophy
The changes encourage users to write more comprehensive, thoughtful messages by:
- Making multi-line input the default behavior
- Reducing pressure to submit quickly
- Providing clear visual cues for submission method
- Maintaining the terminal's clean, focused aesthetic

## Technical Details
- Enhanced `ExpandingInput` component with file upload, auto-sizing, and new submission logic
- Platform detection for appropriate keyboard shortcut display and file handling
- Multi-modal content support for Claude API (images, documents, embedded text)
- Comprehensive file validation and error handling system
- Base64 encoding for images and PDFs, text extraction for other formats
- Improved CSS for button integration, file previews, and responsive design
- Preserved existing session autocomplete functionality
- Smart textarea resizing with manual override capabilities

---

*Released: January 2025*