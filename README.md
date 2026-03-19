# Purbia-Enterprise
Internal software for Purbia Enterprise Private Limited.

For a detailed history of recent feature updates and technical implementation details, please refer to:
[Purbia Development Reference](Purbia_Development_Reference.md)

### Recent Major Updates (March 2026)
- **PI Invoice Enhancements**: Complete transition from strict Date objects to flexible Strings for LR Date, Inward Date, and Outward Date (bypassing DB strict-type validation). Introduced customizable "Actual Qty" overrides specifically within detention sub-rows.
- **Invoice Edit Architecture**: Moved edit flows into a cohesive Dialog popup module to eliminate routing state drops.
- **Physical Letterhead Support**: Implemented `hideHeaderFooter` mode for seamless printing on company pre-printed letterhead paper, replacing digital headers/footers with precision `<br/>` spacing and optimized block heights.
