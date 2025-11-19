# Contacts API Research

## Browser Support Status

The Web Contacts API (ContactsManager/navigator.contacts) has **very limited browser support**:

- **Chrome/Edge on Android**: Supported (requires HTTPS)
- **Chrome/Edge on Desktop**: Not supported
- **Firefox**: Not supported
- **Safari/iOS**: Not supported
- **Other browsers**: Not supported

## Implementation Decision

Due to the extremely limited browser support, we will **NOT implement** the Contacts API integration at this time. The existing vCard upload functionality provides a reliable cross-platform solution.

## Future Considerations

If browser support improves in the future, we can implement:
- `navigator.contacts.select()` for selecting contacts
- Permission-based access to device contacts
- Direct import without file upload

For now, users can:
1. Export contacts from iOS Contacts app as .vcf file
2. Export contacts from Google Contacts as .vcf file
3. Upload the .vcf file through the existing import interface

This approach works reliably across all platforms and browsers.

