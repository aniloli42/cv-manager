import axios, { AxiosError } from "axios";

export async function filterCVMutation(data: { tags: string[] }) {
  try {

    const serverURL = import.meta.env.VITE_SERVER_URL;

    if (serverURL == undefined || serverURL === "")
      throw new Error("Server URL not found!");

    const SERVER_URL = new URL(serverURL)

    const res = await axios.post(SERVER_URL as unknown as string, data, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    return res.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      const error = e.response?.data?.message ?? e.message
      throw new Error(error)
    }
    if (!(e instanceof Error)) throw new Error(`Error not Identified`)

    throw new Error(e.message)
  }
}
