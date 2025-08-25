// Read query parameter and update error message
const params = new URLSearchParams(window.location.search);
const query = params.get('query');
if (query) {
  const isNumeric = /^[0-9]+(\.[0-9]+)?$/.test(query);
  const message = isNumeric
    ? `No Valid Bitmap Exists for ${query}. Check current blockheight or if the Parcel has provenance.`
    : `Name Does Not Exist for ${query}.`;
  document.getElementById('error-message').innerHTML = message;
}