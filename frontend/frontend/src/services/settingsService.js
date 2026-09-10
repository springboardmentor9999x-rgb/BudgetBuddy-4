import api from "./api";

export const updateProfileSettings = async ({ full_name, email }) => {
  const response = await api.put("/settings/profile", { full_name, email });
  return response.data;
};

export const changePassword = async ({
  current_password,
  new_password,
  confirm_new_password,
}) => {
  const response = await api.put("/settings/password", {
    current_password,
    new_password,
    confirm_new_password,
  });
  return response.data;
};

export const updateNotificationPreferences = async ({
  email_notifications_enabled,
  app_notifications_enabled,
}) => {
  const response = await api.put("/settings/notification-preferences", {
    email_notifications_enabled,
    app_notifications_enabled,
  });
  return response.data;
};

export const updateTheme = async (theme) => {
  const response = await api.put("/settings/theme", { theme });
  return response.data;
};

export const deleteMyAccount = async () => {
  const response = await api.delete("/settings/account");
  return response.data;
};
