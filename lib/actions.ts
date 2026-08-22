"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithKakao() {
  await signIn("kakao");
}

export async function signOutAction() {
  await signOut();
}
