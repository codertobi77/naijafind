export const supplierFlow = {
  // List page /dashboard/purchase-requests
  "supplierFlow.list_title": "Purchase Requests",
  "supplierFlow.list_subtitle_supplier":
    "Browse open requests and submit your quotes, or track your own requests.",
  "supplierFlow.list_subtitle_buyer":
    "Track your purchase requests and the quotes received from suppliers.",
  "supplierFlow.open_requests_title": "Open requests",
  "supplierFlow.my_requests_title": "My requests",
  "supplierFlow.no_open_requests":
    "No open requests right now. Check back soon!",
  "supplierFlow.no_requests": "You don't have any purchase requests yet",
  "supplierFlow.no_requests_hint":
    "Publish a request from the “Purchase Request” page to receive supplier quotes.",
  "supplierFlow.view_request": "View details",
  "supplierFlow.quotes_count_one": "{{count}} quote received",
  "supplierFlow.quotes_count_other": "{{count}} quotes received",
  "supplierFlow.delete_error": "Error while deleting the request",
  "supplierFlow.open_attachment": "Open the attachment",

  // Purchase request statuses
  "supplierFlow.status_pending": "Pending",
  "supplierFlow.status_contacted": "Contacted",
  "supplierFlow.status_quoted": "Quote received",
  "supplierFlow.status_completed": "Completed",
  "supplierFlow.status_cancelled": "Cancelled",

  // Detail page /dashboard/purchase-requests/:requestId
  "supplierFlow.request_not_found": "Request not found",
  "supplierFlow.request_not_found_desc":
    "This purchase request does not exist or has been deleted.",
  "supplierFlow.back_to_requests": "Back to requests",
  "supplierFlow.request_date": "Published on {{date}}",
  "supplierFlow.attachment": "Attachment",

  // Quotes received (owner view)
  "supplierFlow.quotes_received_title": "Quotes received",
  "supplierFlow.no_quotes_received":
    "No quotes received yet. Notified suppliers will reply soon.",
  "supplierFlow.owner_panel_title": "Your request",
  "supplierFlow.owner_panel_desc":
    "You own this request. Supplier quotes will appear here as soon as they respond.",
  "supplierFlow.not_owner_info":
    "This request was published by another user. You can view it, but only suppliers can respond.",

  // Quote form (supplier view)
  "supplierFlow.quote_form_title": "Submit a quote",
  "supplierFlow.quote_form_desc":
    "Describe your offer for this request. The buyer will be notified immediately.",
  "supplierFlow.quote_supplier_profile": "Supplier profile",
  "supplierFlow.quote_price": "Price",
  "supplierFlow.quote_currency": "Currency",
  "supplierFlow.quote_delivery_time": "Delivery time",
  "supplierFlow.quote_delivery_placeholder": "e.g. 3-5 days",
  "supplierFlow.quote_message": "Message",
  "supplierFlow.quote_message_placeholder":
    "Describe the terms, availability, quality…",
  "supplierFlow.quote_submit": "Send my quote",
  "supplierFlow.quote_submitting": "Sending…",
  "supplierFlow.quote_submitted_title": "Quote sent!",
  "supplierFlow.quote_submitted_desc":
    "Your quote has been sent to the buyer, who has been notified.",
  "supplierFlow.quote_submit_error": "Error while sending the quote",
  "supplierFlow.quote_profile_required": "Please select a supplier profile",
  "supplierFlow.quote_price_invalid": "Price must be greater than 0",
  "supplierFlow.quote_delivery_required": "Delivery time is required",
  "supplierFlow.quote_already_submitted":
    "You have already submitted a quote for this request with some of your profiles.",
  "supplierFlow.quote_already_submitted_all":
    "You have already submitted a quote for this request with all of your supplier profiles.",
  "supplierFlow.no_supplier_profile":
    "You need an approved supplier profile to submit a quote.",
};

export default supplierFlow;
