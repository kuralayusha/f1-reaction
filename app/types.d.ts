declare module "use-sound" {
  export default function useSound(
    src: string,
    options?: any
  ): [() => void, { sound: HTMLAudioElement }];
}
