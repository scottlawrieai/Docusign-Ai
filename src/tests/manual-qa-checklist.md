# Manual QA Checklist for DocuSign Clone

## Authentication
- [ ] User can register with email and password
- [ ] User receives verification email
- [ ] User can log in with verified credentials
- [ ] User can log out
- [ ] Protected routes redirect to login when not authenticated

## Dashboard
- [ ] Dashboard loads with correct document counts
- [ ] Status tabs (All, Pending, Completed, Expired) work correctly
- [ ] Document cards display with correct information
- [ ] Document cards navigate to document view when clicked

## Document Upload
- [ ] Upload dialog opens from dashboard
- [ ] Drag and drop functionality works
- [ ] File selection via browser dialog works
- [ ] PDF, DOC, DOCX files are accepted
- [ ] Large files (>5MB) are handled appropriately
- [ ] Error messages display for invalid file types

## Document Editor
- [ ] Document preview loads correctly
- [ ] Zoom controls work (zoom in, out, reset)
- [ ] Tab switching between Edit and Preview works
- [ ] Field type dropdown shows all options

## Signature Fields
- [ ] Can add signature fields by clicking on document
- [ ] Can drag fields to reposition
- [ ] Can resize fields by dragging corners/edges
- [ ] Fields remain in correct position after saving
- [ ] Can delete fields

## Signature Capture
- [ ] Signature dialog opens when clicking signature field
- [ ] Drawing on signature pad works
- [ ] Signature appears in field after saving
- [ ] Signature persists after page refresh

## Text Fields
- [ ] Can add text fields (name, email, date, etc.)
- [ ] Input validation works (email format, required fields)
- [ ] Text appears in field after saving

## Sharing
- [ ] Share dialog opens from document view
- [ ] Can add multiple recipients
- [ ] Can remove recipients
- [ ] Email validation works
- [ ] Custom message can be added
- [ ] Send button works and shows confirmation

## Signing Experience
- [ ] Signing link in email works
- [ ] Document loads for signer
- [ ] Required fields are highlighted
- [ ] Can complete all signature and text fields
- [ ] Submission works and shows confirmation
- [ ] Document owner receives notification when signed

## Mobile Responsiveness
- [ ] Test on various screen sizes (desktop, tablet, mobile)
- [ ] UI elements adapt appropriately
- [ ] Touch interactions work on mobile devices

## Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge

## Performance
- [ ] Document loading time is reasonable (<3 seconds)
- [ ] UI remains responsive with many fields
- [ ] No memory leaks after extended use

## Security
- [ ] Authentication tokens expire appropriately
- [ ] Cannot access documents without permission
- [ ] Signing tokens are single-use
- [ ] CORS is properly configured

## Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG standards
- [ ] Form inputs have proper labels

## Error Handling
- [ ] Network errors show appropriate messages
- [ ] Form validation errors are clear
- [ ] Server errors are handled gracefully
- [ ] Console is free of errors and warnings
