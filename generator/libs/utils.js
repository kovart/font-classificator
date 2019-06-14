
const Utils = {
    permutate(str) {
        let results = []

        if (str.length === 1) {
            results.push(str)
            return results
        }

        for (let i = 0; i < str.length; i++) {
            let firstChar = str[i]
            let otherChar = str.substring(0, i) + str.substring(i + 1)
            let otherPermutations = Utils.permutate(otherChar)

            for (let j = 0; j < otherPermutations.length; j++) {
                results.push(firstChar + otherPermutations[j])
            }
        }
        return results
    },
    logInline(msg) {
        // let whiteline = Array(process.stdout.columns).join(" ")
        // process.stdout.write(whiteline + "\r");
        process.stdout.write(msg + "           \r"); // ;) "optimization"
    },
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    },
    formatTime(ms){
        let date = new Date(null)
        date.setMilliseconds(ms)
        return date.toISOString().substr(11, 8)
    },
    average: (function () {
        let arr = []
        return function (number) {
            arr.push(number)
            if(arr.length > 20) arr.unshift()
            let sum = arr.reduce((num, accumulator) => accumulator + num)
            return sum / arr.length
        }
    })()
}

module.exports = {
    Utils
}
