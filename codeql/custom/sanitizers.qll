import javascript
import semmle.javascript.dataflow.TaintTracking

/**
 * Treat local URL/HTML sanitizers as taint sanitizers for CodeQL.
 */
class CustomSanitizer extends TaintTracking::SanitizerNode {
  CustomSanitizer() {
    exists(CallExpr call, RefExpr ref |
      call.getCallee() = ref and
      ref.getName() in [
        "sanitizeExternalUrl",
        "sanitizeImageSrc",
        "sanitizeRichTextHtml",
        "stripHTML"
      ] and
      this = call.getResult()
    )
  }
}
