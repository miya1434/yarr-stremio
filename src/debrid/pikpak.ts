import axios from "axios";

const PIKPAK_API_BASE = "https://api-drive.mypikpak.com/drive/v1";

export const checkPikPakCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    // PikPak doesn't have a direct cache check API
    // Would need to add the magnet and check status
    return false;
  } catch (error) {
    console.error("PikPak cache check error:", error);
    return false;
  }
};

export const getPikPakStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Add magnet to PikPak
    const addResponse = await axios.post(
      `${PIKPAK_API_BASE}/files`,
      {
        kind: "drive#folder",
        upload_type: "UPLOAD_TYPE_URL",
        url: {
          url: magnetLink,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const taskId = addResponse.data.task.id;

    // Wait for task completion
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get task status
    const statusResponse = await axios.get(
      `${PIKPAK_API_BASE}/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    if (statusResponse.data.phase !== "PHASE_TYPE_COMPLETE") {
      return null;
    }

    const fileId = statusResponse.data.file_id;

    // Get download link
    const downloadResponse = await axios.get(
      `${PIKPAK_API_BASE}/files/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    return downloadResponse.data.web_content_link;
  } catch (error) {
    console.error("PikPak stream error:", error);
    return null;
  }
};

