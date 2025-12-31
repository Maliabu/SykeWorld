/**
 * Helper function to create activity log descriptions
 * This is a pure utility function, not a server action
 */
export function createActivityDescription(
  action: string,
  entityType: string,
  entityName?: string,
  details?: string
): string {
  const entityDisplay = entityName || entityType;
  const detailsText = details ? ` (${details})` : "";
  
  const actionMap: Record<string, string> = {
    CREATE: "created",
    UPDATE: "updated",
    DELETE: "deleted",
    LOGIN: "logged in",
    LOGOUT: "logged out",
    VIEW: "viewed",
  };

  const verb = actionMap[action.split("_")[0]] || action.toLowerCase();
  return `${verb} ${entityDisplay}${detailsText}`;
}



