/**
 * templateGenerationService.js
 * Template-based page JSON generation (without OpenAI)
 * Uses predefined templates and content mapping
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load templates
let templates = null;

const loadTemplates = () => {
  if (!templates) {
    const templatePath = path.join(__dirname, '../templates/pageTemplates.json');
    const templateData = fs.readFileSync(templatePath, 'utf8');
    templates = JSON.parse(templateData);
  }
  return templates;
};

export const TemplateGenerationService = {
  
  /**
   * Get list of available template types
   */
  getAvailableTypes() {
    const temps = loadTemplates();
    return Object.keys(temps.templates).map(key => ({
      id: key,
      name: temps.templates[key].name,
      description: temps.templates[key].description,
      pages: temps.templates[key].pages.length
    }));
  },

  /**
   * Get template structure preview
   */
  getTemplatePreview(appType) {
    const temps = loadTemplates();
    const template = temps.templates[appType];
    
    if (!template) {
      throw new Error(`Template type "${appType}" not found`);
    }

    return {
      name: template.name,
      description: template.description,
      pages: template.pages.map(page => ({
        id: page.id,
        name: page.name,
        layoutId: page.layoutId,
        componentCount: page.components.length,
        componentTypes: page.components.map(c => c.type)
      }))
    };
  },

  /**
   * Generate pages from template
   * @param {string} appName - Name of the app
   * @param {string} appType - Type of template (e-commerce, booking, etc.)
   * @param {object} content - Content to fill into template
   */
  generatePageJson(appName, appType, content = {}) {
    const temps = loadTemplates();
    const template = temps.templates[appType];
    
    if (!template) {
      throw new Error(`Template type "${appType}" not found. Available: ${Object.keys(temps.templates).join(', ')}`);
    }

    logger.info(`[TemplateService] Generating ${template.pages.length} pages for ${appName} (${appType})`);

    const currentTimestamp = new Date().toISOString();
    
    const pages = template.pages.map(pageTemplate => {
      const pageContent = content[pageTemplate.id] || {};
      
      return {
        id: pageTemplate.id,
        name: pageTemplate.name,
        appName: appName,
        layoutId: pageTemplate.layoutId,
        themeId: pageTemplate.themeId,
        savedAt: currentTimestamp,
        updatedAt: currentTimestamp,
        components: this.generateComponentsForPage(
          pageTemplate,
          appName,
          pageContent,
          currentTimestamp
        )
      };
    });

    return { pages };
  },

  /**
   * Generate components for a page based on template
   */
  generateComponentsForPage(pageTemplate, appName, content, timestamp) {
    return pageTemplate.components.map((compTemplate, index) => {
      const compId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: compId,
        type: compTemplate.type,
        name: this.getComponentName(compTemplate.role, compTemplate.type),
        appName: appName,
        createdAt: timestamp,
        updatedAt: timestamp,
        commonAttrs: this.getCommonAttrs(compTemplate.type),
        specificAttrs: this.getSpecificAttrs(
          compTemplate.type,
          compTemplate,
          content
        )
      };
    });
  },

  /**
   * Get component name from role and type
   */
  getComponentName(role, type) {
    const names = {
      'hero-headline': 'Hero Headline',
      'hero-subheading': 'Hero Subheading',
      'hero-description': 'Hero Description',
      'page-title': 'Page Title',
      'contact-intro': 'Contact Introduction',
      'about-title': 'About Title',
      'about-content': 'About Content',
      'about-bio': 'About Bio',
      'featured-products': 'Featured Products',
      'product-grid': 'Product Grid',
      'service-list': 'Service List',
      'project-grid': 'Project Grid',
      'menu-items': 'Menu Items',
      'contact-form': 'Contact Form',
      'newsletter': 'Newsletter Signup',
      'booking-form': 'Booking Form',
      'reservation-form': 'Reservation Form'
    };
    
    return names[role] || `${type.charAt(0).toUpperCase() + type.slice(1)} Component`;
  },

  /**
   * Get common attributes for component type (based on hanuma structure)
   */
  getCommonAttrs(componentType) {
    const base = {
      width: "100",
      height: "auto",
      marginTop: "0",
      marginLeft: "0",
      marginRight: "0",
      backgroundColor: "transparent"
    };

    const variants = {
      text: {
        ...base,
        paddingTop: "32",
        paddingBottom: "32",
        paddingLeft: "16",
        paddingRight: "16",
        marginBottom: "24",
        borderRadius: "0",
        boxShadow: "none"
      },
      form: {
        ...base,
        paddingTop: "16",
        paddingBottom: "16",
        paddingLeft: "16",
        paddingRight: "16",
        marginBottom: "16",
        borderRadius: "8",
        boxShadow: "none"
      },
      card: {
        ...base,
        paddingTop: "24",
        paddingBottom: "24",
        paddingLeft: "20",
        paddingRight: "20",
        marginBottom: "16",
        borderRadius: "12",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      },
      button: {
        ...base,
        paddingTop: "12",
        paddingBottom: "12",
        paddingLeft: "24",
        paddingRight: "24",
        marginBottom: "8",
        borderRadius: "6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      },
      image: {
        ...base,
        paddingTop: "0",
        paddingBottom: "0",
        paddingLeft: "0",
        paddingRight: "0",
        marginBottom: "16",
        borderRadius: "8",
        boxShadow: "none"
      }
    };

    return variants[componentType] || variants.text;
  },

  /**
   * Get specific attributes based on component type and template
   */
  getSpecificAttrs(type, template, content) {
    switch (type) {
      case 'text':
        return this.getTextAttrs(template, content);
      case 'form':
        return this.getFormAttrs(template, content);
      case 'card':
        return this.getCardAttrs(template, content);
      case 'button':
        return this.getButtonAttrs(template, content);
      case 'image':
        return this.getImageAttrs(template, content);
      default:
        return {};
    }
  },

  /**
   * Generate text component specificAttrs
   */
  getTextAttrs(template, content) {
    const variants = {
      h1: { fontSize: "48px", fontWeight: "bold", textAlign: "center" },
      h2: { fontSize: "32px", fontWeight: "bold", textAlign: "left" },
      h3: { fontSize: "24px", fontWeight: "600", textAlign: "left" },
      paragraph: { fontSize: "16px", fontWeight: "normal", textAlign: "left" }
    };

    const variantStyle = variants[template.variant] || variants.paragraph;
    
    // Get content from contentKey path (e.g., "home.headline")
    const contentText = this.getContentValue(content, template.contentKey) || 
                       `Your ${template.role} text here`;

    return {
      content: contentText,
      variant: template.variant,
      ...variantStyle,
      color: "#000000"
    };
  },

  /**
   * Generate form component specificAttrs (based on hanuma structure)
   */
  getFormAttrs(template, content) {
    const presets = {
      contact: {
        formType: "Contact",
        title: content.title || "Contact Us",
        description: content.description || "We'd love to hear from you",
        submitLabel: "Send Message",
        fields: [
          {
            id: "name",
            label: "Your Name",
            type: "text",
            required: true,
            validation: {
              minLength: 2,
              maxLength: 100,
              customMessage: "Please enter your name"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          },
          {
            id: "email",
            label: "Email Address",
            type: "email",
            required: true,
            validation: {
              pattern: "email",
              customMessage: "Please enter a valid email address"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          },
          {
            id: "message",
            label: "Message",
            type: "textarea",
            required: true,
            validation: {
              minLength: 10,
              maxLength: 1000,
              customMessage: "Please enter your message (at least 10 characters)"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          }
        ],
        ui: {
          themeTokens: "default",
          spacingHints: "responsive"
        },
        actions: [
          {
            action: "showMessage",
            title: "Thank You!",
            message: content.successMessage || "We've received your message and will get back to you soon",
            buttonText: "Close",
            autoClose: 0
          }
        ]
      },
      newsletter: {
        formType: "Newsletter",
        title: content.title || "Subscribe to Our Newsletter",
        description: content.description || "Get updates delivered to your inbox",
        submitLabel: "Subscribe",
        fields: [
          {
            id: "email",
            label: "Email Address",
            type: "email",
            required: true,
            validation: {
              pattern: "email",
              customMessage: "Please enter a valid email address"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          }
        ],
        ui: {
          themeTokens: "default",
          spacingHints: "responsive"
        },
        actions: [
          {
            action: "showMessage",
            title: "Subscribed!",
            message: "Thank you for subscribing to our newsletter",
            buttonText: "Close",
            autoClose: 3000
          }
        ]
      },
      booking: {
        formType: "Booking",
        title: content.title || "Book Your Appointment",
        description: content.description || "Select your preferred date and time",
        submitLabel: "Book Now",
        fields: [
          {
            id: "name",
            label: "Your Name",
            type: "text",
            required: true,
            validation: {
              minLength: 2,
              maxLength: 100,
              customMessage: "Please enter your name"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          },
          {
            id: "email",
            label: "Email Address",
            type: "email",
            required: true,
            validation: {
              pattern: "email",
              customMessage: "Please enter a valid email"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          },
          {
            id: "phone",
            label: "Phone Number",
            type: "tel",
            required: true,
            validation: {
              pattern: "phone",
              customMessage: "Please enter a valid phone number"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          },
          {
            id: "date",
            label: "Preferred Date",
            type: "text",
            required: true,
            validation: {
              customMessage: "Please select a date"
            },
            dataSource: { type: "manual" },
            visibility: true,
            defaultValue: ""
          }
        ],
        ui: {
          themeTokens: "default",
          spacingHints: "responsive"
        },
        actions: [
          {
            action: "showMessage",
            title: "Booking Confirmed!",
            message: "Your appointment has been booked successfully",
            buttonText: "Close",
            autoClose: 0
          }
        ]
      }
    };

    return presets[template.preset] || presets.contact;
  },

  /**
   * Generate card component specificAttrs
   */
  getCardAttrs(template, content) {
    const contentArray = this.getContentValue(content, template.contentKey) || [];
    const count = template.count || 1;
    
    // If content is array, take first item for single card
    const cardContent = Array.isArray(contentArray) ? contentArray[0] : contentArray;

    return {
      title: cardContent?.title || "Card Title",
      description: cardContent?.description || "Card description goes here",
      imageUrl: cardContent?.imageUrl || "/images/placeholder.jpg",
      link: cardContent?.link || "#",
      linkText: cardContent?.linkText || "Learn More"
    };
  },

  /**
   * Generate button component specificAttrs
   */
  getButtonAttrs(template, content) {
    return {
      label: content.label || "Click Me",
      action: content.action || "navigateTo",
      variant: "primary",
      url: content.url || "#",
      newTab: content.newTab || false
    };
  },

  /**
   * Generate image component specificAttrs
   */
  getImageAttrs(template, content) {
    return {
      src: content.src || "/images/placeholder.jpg",
      alt: content.alt || "Image",
      caption: content.caption || "",
      width: "100%",
      height: "auto"
    };
  },

  /**
   * Helper to get content value from nested key path
   * e.g., "home.headline" -> content.home.headline
   */
  getContentValue(content, keyPath) {
    if (!keyPath) return null;
    
    const keys = keyPath.split('.');
    let value = content;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }
};

export default TemplateGenerationService;



