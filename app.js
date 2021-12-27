const app = new Vue({
    el: '#app',
    data: {
        url: '',
        slug: '',
        retrieved: null,
        succeed: false,
        error: false,
    },
    methods: {
        async createUrl() {
            const response = await fetch('/url', {
                method: 'POST',
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    url: this.url,
                    slug: this.slug
                })
            })
            this.retrieved = await response.json()
            if (this.retrieved["url"] !== undefined) {
                this.succeed = true;
                this.error = false;
                console.log("hi")
            } else {
                this.succeed = false;
                this.error = true
                console.log('telolet')
            }
        }
    }
})