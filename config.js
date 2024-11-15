// Configuration for Code Cleaner

export const config = {

	// Array of tags to remove, leaving content intact when located inside a content body
	innerContentBodyTagsToRemove : ["header", "footer"],
	// Specify the classes that should be applied to vertical tables
	vertTableClasses: ["vert-table", "display-vertical", "display-vert"],
  // iframe titles that should be logged
  titlesToCheck: ["YouTube video player"],
  // Skips certain iframes like youtube placeholder
  iframesToExclude: ["https://www.youtube.com/embed/NpEaa2P7qZI?si=DFcFec4auMcyTLXX"],
};