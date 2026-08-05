/**
 * registerWidget.js — Dashboard Widget Self-Registration Helper
 *
 * Usage:
 *   import { registerWidget } from '../../core/registerWidget';
 *
 *   registerWidget({
 *     key:            "analyticsSnapshot",
 *     label:          "Analytics Snapshot",
 *     component:      AnalyticsSnapshotWidget,
 *     size:           "full",    // full | half | quarter
 *     order:          1,
 *     defaultVisible: true,
 *     permissions:    ["analytics.read"],
 *   });
 */
export { registerWidget, getWidget, getWidgets, getWidgetList } from './cmsCore.js';
