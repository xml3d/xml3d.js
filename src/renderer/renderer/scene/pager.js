var DEFAULT_PAGE_SIZE = 1 << 12;

/**
 * @constructor
 */
var Pager = function (opt) {
    opt = opt || {};

    this.pageSize = opt.pageSize || DEFAULT_PAGE_SIZE;

    /** @type Array<Float32Array> */
    this.pages = [];
    /** @type number */
    this.nextOffset = 0;
    /** @type Array<*> */
    this.freeEntries = [];
    // Add a first page
    this.addPage();
};

XML3D.extend(Pager.prototype, {
    addPage: function () {
        var page = new Float32Array(this.pageSize);
        this.pages.push(page);
        this.nextOffset = 0;
        XML3D.debug.logInfo("Adding page", this.pages.length, "(", this.pageSize * Float32Array.BYTES_PER_ELEMENT * this.pages.length / 1024, "kB)");
    },

    getPageEntry: function (size) {
        if (!size)
            throw new Error("No size given for page entry");
        return this.reusePageEntry(size) || this.createPageEntry(size);
    },

    /**
     * @param {number} size Requested size in number of floats
     * @returns {{ page: Float32Array, offset: number, size: number }}
     */
    reusePageEntry: function (size) {
        var sameSizeEntries = this.freeEntries[size];
        if (sameSizeEntries && sameSizeEntries.length) {
            return sameSizeEntries.pop();
        }
        return null;
    },

    /**
     * @param {number} size  Size in number of floats
     * @returns {{ page: Float32Array, offset: number, size: number }}
     */
    createPageEntry: function (size) {
        if (this.nextOffset + size > this.pageSize) {
            this.addPage();
            return this.getPageEntry(size);
        }
        var page = this.pages[this.pages.length - 1];
        var localOffset = this.nextOffset;
        this.nextOffset += size;
        return {page: page, offset: localOffset, size: size};
    },

    /**
     *
     * @param {{ page: Float32Array, offset: number, size: number }} entryInfo
     */
    freePageEntry: function (entryInfo) {
        var sameSizeEntries = this.freeEntries[entryInfo.size];
        if (!sameSizeEntries) {
            sameSizeEntries = this.freeEntries[entryInfo.size] = [];
        }
        sameSizeEntries.push(entryInfo);
    }
});

module.exports = Pager;

