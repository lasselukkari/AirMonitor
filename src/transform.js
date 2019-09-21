const dataView = ({ buffer }) => new DataView(buffer);
const getFloat = f => dataView(f).getFloat32(0);
const getInt = i => dataView(i).getInt32(0);
const chunk = (a, s) => Array.from({ length: Math.ceil(a.length / s) }, (_, i) => a.slice(i * s, i * s + s));
const parse = l => ([getInt(l[4]), getInt(l[3]), getFloat(l[2]), getFloat(l[1]), getInt(l[0])])
const ts = (s) => new Date(s * 1000).toLocaleString();
const fix = (n) => n.toFixed(2)
const toEntry = (a) => ({ time: ts(a[4]), Humidity: fix(a[3]), Temperature: fix(a[2]), TVOC: fix(a[1]), CO2: fix(a[0]) });
const co2error = ({ CO2}) => (CO2 < 0 || CO2 > 5000);
const tvocError = ({ TVOC }) => (TVOC < 0 || TVOC > 5000);
const temperatureError = ({ Temperature }) => (Temperature < -40 || Temperature > 250);
const humidityError = ({ Humidity }) => (Humidity < 0 || Humidity > 100);
const error = (entry) =>  !(co2error(entry) || tvocError(entry) || temperatureError(entry) || humidityError(entry));
const getOne = (d) => toEntry(parse(chunk(new Uint8Array(d).reverse(), 4)))
const getMany = (d) => chunk(new Uint8Array(d), 20).map(getOne).filter(error)

export default { getOne, getMany }
