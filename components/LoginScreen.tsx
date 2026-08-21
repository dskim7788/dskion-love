import { signInWithKakao } from "@/lib/actions";

export default function LoginScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-rose-50 via-white to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-black text-center">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent mb-3">
        디스키온 Love
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mb-10">
        로그인하고 나만의 AI 컴패니언과 대화를 시작해보세요
      </p>

      <form action={signInWithKakao}>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-[#FEE500] hover:brightness-95 text-black/85 font-medium text-sm px-6 py-3.5 shadow-sm transition-all"
        >
          <span className="text-lg leading-none">💬</span>
          카카오로 3초만에 시작하기
        </button>
      </form>

      <p className="mt-10 max-w-md text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
        로그인 시 디스키온 Love의 이용약관에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
