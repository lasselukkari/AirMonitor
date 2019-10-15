const dataView = ({ buffer }) => new DataView(buffer);
const getFloat = f => dataView(f).getFloat32(0);
const getInt = i => dataView(i).getInt32(0);
const chunk = (a, s) => Array.from({ length: Math.ceil(a.length / s) }, (_, i) => a.slice(i * s, i * s + s));
const parse = l => ([getInt(l[4]), getInt(l[3]), getFloat(l[2]), getFloat(l[1]), getInt(l[0])])
const toEntry = (a) => ({ Timestamp: a[4] * 1000, Humidity: a[3], Temperature: a[2], TVOC: a[1], CO2: a[0] });
const getOne = (d) => toEntry(parse(chunk(new Uint8Array(d).reverse(), 4)))
const getMany = (d) => chunk(new Uint8Array(d), 20).map(getOne)
const getRanges = (d) => chunk(new Uint8Array(d).reverse(), 4).map(getInt).map((a) => new Date(a * 1000 * 86400))

export default { getOne, getMany, getRanges }
