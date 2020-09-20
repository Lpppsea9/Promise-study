(function (window) {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'
  
  function Promise(excutor) {
    const self = this
    self.status = PENDING
    self.data = undefined
    self.callbacks = []

    function resolve(value) {
      if (self.status !== PENDING) {
        return
      }
      self.status = RESOLVED
      self.data = value
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach(calbackObj => {
            calbackObj.onResolved(value)
          });
        })
      }
    }

    function reject(reason) {
      if (self.status !== PENDING) {
        return
      }
      self.status = REJECTED
      self.data = reason
      if (self.callbacks > 0) {
        setTimeout(() => {
          self.callbacks.forEach(calbackObj => {
            calbackObj.onRejected(reason)
          });
        })
      }
    }
    
    try {
      excutor(resolve,reject)
    } catch (error) {
      reject(error)
    }
  }
})()