import { domTransform } from "..//hooks/domTransform.js";

export function removeJQueryScript() {
	return domTransform((document) => {
		const elements = document.querySelectorAll('script[src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"]');
		elements.forEach((el) => el.remove());
	});
}
