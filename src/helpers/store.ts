import create from 'zustand'

const useStore = create(set => ({
  router: null,
  dom: null,
  night: false,
  // @ts-ignore
  setNight: () => set({ night: true }),
  // @ts-ignore
  setDay: () => set({ night: false })
}
))

export const mutation = {
  rotation: -1
}

export default useStore
