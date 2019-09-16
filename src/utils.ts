export const time = (start: Date) => (new Date().getTime() - start.getTime())

if (!('toJSON' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      const alt: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
      Object.getOwnPropertyNames(this).forEach((key: string) => { alt[key] = this[key] }, this)
      return alt
    },
    configurable: true,
    writable: true
  })
}
