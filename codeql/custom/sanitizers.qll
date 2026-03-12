import javascript
import semmle.javascript.dataflow.TaintTracking

/**
 * Enhanced sanitizer to detect sanitized values through variable assignments
 * and method calls in your codebase.
 */
class CustomSanitizer extends TaintTracking::SanitizerNode {
  CustomSanitizer() {
    // Direct sanitizer function calls
    exists(CallExpr call |
      (
        // Direct function calls
        exists(RefExpr ref |
          call.getCallee() = ref and
          ref.getName() in [
            "sanitizeExternalUrl",      
            "sanitizeImageSrc",         
            "sanitizeRichTextHtml",     
            "stripHTML",                
            "stripHtmlTags",            
            "escapeHtml",               
            "sanitizeHtml",             
            "encodeHtml",               
            "sanitizeUrl",
            "decodeHtmlEntities"
          ]
        )
        or
        // Method calls (obj.method())
        exists(DotExpr dot |
          call.getCallee() = dot and
          dot.getPropertyName() in [
            "sanitizeExternalUrl",
            "sanitizeImageSrc", 
            "sanitizeRichTextHtml",
            "stripHTML",
            "stripHtmlTags",
            "escapeHtml",
            "sanitizeHtml",
            "encodeHtml",
            "sanitizeUrl",
            "decodeHtmlEntities"
          ]
        )
      ) and
      this = call.getResult()
    )
    or
    // Variables that hold sanitized values (safeHref, cleanedHtml, etc.)
    exists(VarExpr var |
      this = var and
      var.getName() in [
        "safeHref", "cleanedHtml", "sanitizedUrl", "cleanContent", 
        "safeContent", "escapedHtml", "strippedHtml", "decodedHtml"
      ]
    )
  }
}

/**
 * Sanitizer for known library functions
 */
class KnownLibrarySanitizer extends TaintTracking::SanitizerNode {
  KnownLibrarySanitizer() {
    exists(CallExpr call |
      // DOMPurify.sanitize()
      (
        exists(DotExpr dot |
          call.getCallee() = dot and
          dot.getBase().(RefExpr).getName() = "DOMPurify" and
          dot.getPropertyName() = "sanitize"
        )
      )
      or  
      // sanitize-html library calls
      (
        exists(RefExpr ref |
          call.getCallee() = ref and
          ref.getName() = "sanitizeHtml"
        )
      )
      or
      // validator library calls
      (
        exists(DotExpr dot |
          call.getCallee() = dot and
          dot.getBase().(RefExpr).getName() = "validator" and
          dot.getPropertyName() in ["escape", "blacklist", "whitelist"]
        )
      )
    ) and
    this = call.getResult()
  }
}

/**
 * DOMParser textContent extraction - this is a safe sanitization pattern
 */
class DOMParserTextContentSanitizer extends TaintTracking::SanitizerNode {
  DOMParserTextContentSanitizer() {
    // doc.body.textContent is safe (strips HTML)
    exists(DotExpr textContent |
      this.asExpr() = textContent and
      textContent.getPropertyName() = "textContent" and
      exists(DotExpr bodyAccess |
        textContent.getBase() = bodyAccess and
        bodyAccess.getPropertyName() = "body"
      )
    )
  }
}

/**
 * URL validation functions that make URLs safe
 */
class UrlValidationSanitizer extends TaintTracking::SanitizerNode {
  UrlValidationSanitizer() {
    exists(CallExpr call |
      exists(RefExpr ref |
        call.getCallee() = ref and
        ref.getName() in [
          "normalizeURL",
          "validateURLSafe", 
          "validateDomain",
          "validateTLD",
          "removeProtocol"
        ]
      ) and
      this = call.getResult()
    )
  }
}
