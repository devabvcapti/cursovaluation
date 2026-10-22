import { courseContent } from "@/content/curso";

const WHATSAPP_BRAND_GREEN = "#25D366";

/**
 * Fixed bottom-right floating button, present on every page, opening a
 * WhatsApp chat with ABVCAP's Business number in a new tab.
 */
export function WhatsAppWidget() {
  const href = `https://wa.me/${courseContent.whatsappNumber}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale com a ABVCAP pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
      style={{ backgroundColor: WHATSAPP_BRAND_GREEN }}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 fill-white"
      >
        <path d="M16.004 2.667c-7.364 0-13.333 5.969-13.333 13.333 0 2.353.617 4.56 1.697 6.473L2.667 29.333l7.023-1.843a13.26 13.26 0 0 0 6.314 1.61h.006c7.364 0 13.333-5.97 13.333-13.334s-5.97-13.333-13.339-13.333Zm0 24.4a11.03 11.03 0 0 1-5.627-1.542l-.404-.24-4.168 1.093 1.113-4.064-.263-.417a11.02 11.02 0 0 1-1.69-5.897c0-6.106 4.967-11.073 11.075-11.073 2.958 0 5.74 1.153 7.831 3.246a10.996 10.996 0 0 1 3.242 7.833c0 6.106-4.967 11.061-11.11 11.061Zm6.071-8.287c-.332-.166-1.966-.97-2.271-1.08-.305-.111-.527-.166-.748.167-.222.332-.86 1.08-1.054 1.302-.194.222-.388.25-.72.083-.332-.166-1.4-.516-2.667-1.646-.986-.879-1.652-1.965-1.846-2.297-.194-.333-.021-.512.146-.678.149-.148.332-.388.498-.582.166-.194.221-.333.332-.555.111-.222.055-.416-.028-.583-.083-.166-.747-1.802-1.025-2.468-.27-.648-.544-.561-.748-.572l-.636-.011c-.222 0-.583.083-.888.416-.305.333-1.164 1.137-1.164 2.774 0 1.636 1.192 3.216 1.358 3.438.166.222 2.347 3.584 5.688 5.027.795.343 1.415.548 1.899.701.798.254 1.524.218 2.098.132.64-.096 1.966-.804 2.244-1.581.277-.777.277-1.443.194-1.582-.083-.139-.305-.222-.637-.389Z" />
      </svg>
    </a>
  );
}
