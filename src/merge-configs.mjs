import merge from "lodash.mergewith";

// Merge two configs, except arrays
export default function mergeConfigs(one, two) {
    return merge(
        {},
        one,
        two,
        
        // Disable lodash's default array merging behavior,
        // see https://github.com/tivac/dullard/issues/15
        (a, b) => (Array.isArray(b) ? b : undefined)
    );
}
