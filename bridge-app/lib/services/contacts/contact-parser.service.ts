/**
 * Service for parsing contact files (vCard format)
 */

import vcard from 'vcard-parser'
import type { Contact } from '@/types/contacts'
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/contact.utils'

export class ContactParserService {
  /**
   * Parse vCard file
   */
  async parseVCardFile(file: File | Buffer): Promise<Contact[]> {
    let content: string

    if (file instanceof File) {
      content = await file.text()
    } else {
      content = file.toString('utf-8')
    }

    return this.parseVCardContent(content)
  }

  /**
   * Parse vCard content string
   */
  parseVCardContent(content: string): Contact[] {
    try {
      const cards = vcard.parse(content)
      const contacts: Contact[] = []

      for (const card of Object.values(cards)) {
        const contact = this.parseVCard(card)
        if (contact) {
          contacts.push(contact)
        }
      }

      return contacts
    } catch (error: any) {
      throw new Error(`Failed to parse vCard: ${error.message}`)
    }
  }

  /**
   * Parse a single vCard object
   */
  private parseVCard(card: any): Contact | null {
    // Extract name
    const fullName = card.fn?.[0]?.value || ''
    const firstName = card.n?.[0]?.value?.[0] || ''
    const lastName = card.n?.[0]?.value?.[1] || ''
    const name = fullName || `${firstName} ${lastName}`.trim() || undefined

    // Extract emails
    const emails: string[] = []
    if (card.email) {
      for (const emailEntry of Array.isArray(card.email) ? card.email : [card.email]) {
        const email = emailEntry.value || emailEntry
        if (email && typeof email === 'string') {
          emails.push(email)
        }
      }
    }

    // Extract phone numbers
    const phones: string[] = []
    if (card.tel) {
      for (const telEntry of Array.isArray(card.tel) ? card.tel : [card.tel]) {
        const phone = telEntry.value || telEntry
        if (phone && typeof phone === 'string') {
          phones.push(phone)
        }
      }
    }

    // Extract notes
    const notes = card.note?.[0]?.value || card.note || undefined

    // Extract organization
    const organization = card.org?.[0]?.value || card.org || undefined

    // Extract job title
    const jobTitle = card.title?.[0]?.value || card.title || undefined

    // Extract addresses
    const addresses: Array<{ type: 'home' | 'work' | 'other'; value: string }> = []
    if (card.adr) {
      for (const adrEntry of Array.isArray(card.adr) ? card.adr : [card.adr]) {
        const adr = adrEntry.value || adrEntry
        if (Array.isArray(adr) && adr.length >= 7) {
          // vCard address format: [PO Box, Extended Address, Street, Locality, Region, Postal Code, Country]
          const parts = adr.filter(Boolean)
          if (parts.length > 0) {
            const addressValue = parts.join(', ')
            const type = (adrEntry.type || '').toLowerCase().includes('work') ? 'work' :
                         (adrEntry.type || '').toLowerCase().includes('home') ? 'home' : 'other'
            addresses.push({ type, value: addressValue })
          }
        }
      }
    }

    // Extract URLs
    const urls: Array<{ type: string; value: string }> = []
    if (card.url) {
      for (const urlEntry of Array.isArray(card.url) ? card.url : [card.url]) {
        const url = urlEntry.value || urlEntry
        if (url && typeof url === 'string') {
          const type = urlEntry.type || 'homepage'
          urls.push({ type, value: url })
        }
      }
    }

    // Extract birthday
    let birthday: Date | undefined
    if (card.bday) {
      const bdayValue = card.bday?.[0]?.value || card.bday
      if (bdayValue) {
        try {
          // Try parsing as ISO date or various formats
          const parsed = new Date(bdayValue)
          if (!isNaN(parsed.getTime())) {
            birthday = parsed
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Extract photo
    let photo: string | undefined
    if (card.photo) {
      const photoValue = card.photo?.[0]?.value || card.photo
      if (photoValue) {
        if (typeof photoValue === 'string') {
          // Could be a URL or base64 data
          photo = photoValue
        } else if (photoValue.uri) {
          photo = photoValue.uri
        }
      }
    }

    // Skip if no identifying information
    if (!name && emails.length === 0 && phones.length === 0) {
      return null
    }

    return {
      name,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      emails: emails.filter(Boolean),
      phones: phones.filter(Boolean),
      notes,
      organization,
      jobTitle,
      addresses: addresses.length > 0 ? addresses : undefined,
      urls: urls.length > 0 ? urls : undefined,
      birthday,
      photo,
      rawData: card,
    }
  }

  /**
   * Normalize contact data
   */
  normalizeContact(contact: Contact): Contact {
    return {
      ...contact,
      name: contact.name ? normalizeName(contact.name) : undefined,
      firstName: contact.firstName ? normalizeName(contact.firstName) : undefined,
      lastName: contact.lastName ? normalizeName(contact.lastName) : undefined,
      emails: contact.emails.map(normalizeEmail).filter(Boolean),
      phones: contact.phones.map(normalizePhone).filter(Boolean),
    }
  }
}

