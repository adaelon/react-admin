/**
 * 简化mock请求写法
 *
 * 约定：method url delay，各部分以单个空格隔开
 *      url 以re:开头，将被转换为正则，比如：re:/mock/user-center/.+ -> /\/mock\/user-center\/.+/
 *
 * @example
 * 'get /mock/users 1000' : users,
 *
 * @param mock
 * @param mocks
 */
 export const simplify = (mock, mocks) =>
 mocks.forEach((item) =>
     Object.keys(item).forEach((key) => {
         let method = key.split(' ')[0];
         let url = key.split(' ')[1];
         const delay = key.split(' ')[2] || 300;
         const result = item[key];

         method = `on${method.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())}`;

         if (url.startsWith('re:')) {
             url = new RegExp(url.replace('re:', ''));
         }

         if (typeof result === 'function') {
             mock[method](url).reply((config) => {
                 return new Promise((resolve) => {
                     setTimeout(async () => {
                         try {
                             const response = await result(config);
                             console.log('Mock response:', response);
                             resolve([200, response]);
                         } catch (error) {
                             console.error('Mock error:', error);
                             resolve([400, { message: 'Mock error occurred' }]);
                         }
                     }, delay);
                 });
             });
         } else {
             mock[method](url).reply(() => {
                 return new Promise((resolve) => {
                     setTimeout(() => {
                         console.log('Mock response:', result);
                         resolve([200, result]);
                     }, delay);
                 });
             });
         }
     }),
 );

/**
* 获取随机数
* @param max
* @returns {number}
*/
export function randomNumber(max) {
 return Math.ceil(Math.random() * max);
}

/**
* 随机获取 数组中 count 个元素
* @param arr
* @param count
* @returns {FlatArray<*[], 1>[]}
*/
export function randomArray(arr, count) {
 const source = [...arr];
 const result = [];

 for (let i = 0; i < count; i++) {
     const randomIndex = randomNumber(source.length - 1);
     result.push(source.splice(randomIndex, 1));
 }
 return result.flat();
}
