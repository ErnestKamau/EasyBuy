// src/lib/auth.ts
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LoginPayload = { username: string; password: string };
type LoginResponse = { access: string; refresh: string };

export async function login(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>("/auth/login/", payload);
  await AsyncStorage.setItem("auth_token", data.access);
  await AsyncStorage.setItem("refresh_token", data.refresh);
}
