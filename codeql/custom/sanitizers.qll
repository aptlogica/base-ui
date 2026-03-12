import javascript
import semmle.javascript.security.dataflow.DomBasedXssQuery

/**
 * Simple sanitizer - mark these function calls as safe
 */
class CustomSanitizerBarrier extends DomBasedXss::Sanitizer {
  CustomSanitizerBarrier() {
    exists(CallExpr call | 
      this = call and
      call.getCallee().(RefExpr).getName() in [
        "sanitizeImageSrc",
        "sanitizeExternalUrl", 
        "sanitizeRichTextHtml",
        "stripHTML"
      ]
    )
  }
}
