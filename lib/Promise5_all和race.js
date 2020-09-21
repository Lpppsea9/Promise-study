/* 
自定义Promise模块:IIFE
*/
(function (window) {
    const PENDING = 'pending'
    const RESOLVED = 'reslved'
    const REJECTED = 'rejected'
    /* 
    Promise构造函数
    excutor:执行器函数(同步执行)
    */
    function Promise(excutor) { 
      //将当前promise对象保存起来
      const self = this
      self.status = PENDING //给promise对象指定status属性，初始值为peding
      self.data = undefined // 给promise对象指定一个用于存储结果数据的属性
      self.callbacks = [] // 每个元素的结构： {onResolved() {}, onRejected() {}}

      function resolve(value) {
          //如果当前状态不是peding，直接结束
          if (self.status !== PENDING) {
            return
          }

          // 将状态改为resolved
          self.status = RESOLVED 
          //保存value数据
          self.data = value
          //如果有待执行callback函数，立即异步执行回调
          if (self.callbacks.length > 0) {
            setTimeout(() => { //放入队列中执行所有成功的回调
                self.callbacks.forEach(calbacksObj => {
                  calbacksObj.onResolved(value)
                })
            });
          }
      }

      function reject(reason) {
          if (self.status !== PENDING) {
            return
          }
          // 将状态改为resolved
          self.status = REJECTED 
          //保存value数据
          self.data = reason
          //如果有待执行callback函数，立即异步执行回调
          if (self.callbacks.length > 0) {
            setTimeout(() => { //放入队列中执行所有成功的回调
                self.callbacks.forEach(calbacksObj => {
                  calbacksObj.onRejected(reason)
                });
            })
          }
      }

      //立即同步执行excutor
      try {
          excutor(resolve,reject)
      } catch(error) { //如果执行器出现异常，promise对象变为rejected状态
          reject(error)
      }
    }

    /* 
    Promise原型对象的then()
    指定成功和失败的回调函数
    返回一个新的promise对象
    */
    Promise.prototype.then = function (onResolved, onRejected) {
      
      onResolved = typeof onResolved==='function' ? onResolved : value => value //向后传递成功的value
      //指定默认的失败的回调(实现错误/异常传透的关键点)
      onRejected = typeof onRejected==='function' ? onRejected : reason => {throw reason} //向后传递失败的reason
      
      const self = this
      
      //返回一个新的promise对象
      return new Promise((reslove, reject) => {

        /* 
        调用指定回调函数处理，根据执行结果，改变return的promise状态
        */
        function handle(callback) {
              /* 
              1.如果抛出异常，return的promise就会失败，reason就是error
              2.如果回调函数返回不是promise,return的promise就会成功，value就是返回的值
              3.如果回调函数返回是promise，return的promise结果就是这个promise结果
              */
              try {
                const result = onResolved(self.data)
                // 3. 如果回调函数返回是promise， return的promise结果就是这个promise结果
                if (result instanceof Promise) {
                    result.then(
                      value => reslove(value),  //当result成功时，让return的promise也成功
                      reason => reject(reason)  
                    )
                    // result.then(reslove,reject)
                } else {
                    // 2.如果回调函数返回不是promise,return的promise就会成功，value就是返回的值
                    reslove(result)
                }

              } catch (error) {
                // 1.如果抛出异常，return的promise就会失败，reason就是error
                reject(error)
              }
        }
          if (self.status === PENDING) {
            //当前状态还是pending状态，将和回调函数保存起来
            self.callbacks.push({
              onResolved(value) {
                handle(onResolved)
              },
              onRejected(reason) {
                handle(onRejected)
              }
            })
          } else if (self.status === RESOLVED) { //当前是resolved状态，异步执行onResolve并改变return的promise状态
            setTimeout(() => {
              handle(onResolved)
            })
          } else { //当前是rejected状态，异步执行onrejected并改变return的promise状态'
            setTimeout(() => {
              handle(onRejected)
            })
          }
      })
    }

    /* 
    Promise原型对象的catch()
    指定失败的回调函数
    返回一个新的promise对象
    */
    Promise.prototype.catch = function (onRejected) {
      return this.then(undefined,onRejected)
    }

    /* 
    Promis函数对象的resolve方法
    返回制定结果一个成功的promise
    */
    Promise.resolve = function (value) {
      //返回一个成功/失败的promise
      return new Promise((reslove, reject) => {
        //value是promise
        if (value instanceof Promise) {//使用value的结果作为promise的结果
          value.then(reslove,reject)
        } else {//value不是promise => 变为成功，数据是value
          resolve(value)
        }
      })
    }

    /* 
    Promis函数对象的reject方法
    返回一个指定reason的失败的promise
    */
    Promise.reject = function (reason) {
      //返回一个失败的promise
      return new Promise((reslove, reject) => {
        reject(reason)
      })
    }

    /* 
    Promis函数对象的all方法
    返回一个promise，只有当所有promise都成功时才成功，否则只要有一个失败就失败
    */
    Promise.all = function (promises) {
      //用来保存所有成功value数组
      const values = new Array(promises.length)
      //用来保存成功promise的数量
      let resolvedCount = 0
      return new Promise((reslove, reject) => {
        //遍历获取每个promise的结果
        promises.forEach((p, index) => {
          Promise.resolve(p).then(
            value => {
              resolvedCount++
              // p成功，将成功的value保存values
              // values.push(value)
              values[index] = value

              //如果全部成功了，将return的promise改为成功
              if (resolvedCount===promises.length) {
                reslove(values)
              }

            },
            reason => {//只要一个失败了，return的promise就失败
              reject(reason)
            }
          )
        })
      })
    }

    /* 
    Promise函数对象的race方法
    返回一个promise，其结果由第一个完成的promise决定
    */
    Promise.race = function (promises) {
        //返回一个promise
      return new Promise((resolve, reject) => {
        //遍历获取每个promise的结果
        promises.forEach((p, index) => {
          Promise.resolve(p).then(
            value => {//一旦有成功了，将return变为成功
              resolve(value)
            },
            reason => {//一旦有失败了，将return变为失败
              reject(reason)
            }
          )
        })
      })
    }
    
    
})()
