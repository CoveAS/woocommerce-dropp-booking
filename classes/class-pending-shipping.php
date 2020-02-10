<?php
/**
 * Pending shipping
 *
 * @package woocommerce-dropp-shipping
 */

namespace Dropp;


/**
 * Pending shipping
 *
 * Creates a new order status for pending shipping.
 * Also adds a status column to the order view.
 */
class Pending_Shipping {
	/**
	 * Setup
	 */
	public static function setup() {
		add_filter( 'manage_edit-shop_order_columns', __CLASS__ . '::dropp_status_column', 15 );
		add_action( 'manage_shop_order_posts_custom_column', __CLASS__ . '::dropp_column_value' );


		// Register awaiting shipment status.
		add_action( 'init', __CLASS__ . '::register_pending_shipment_order_status' );

		// Add awaiting shipping to existing order statuses.
		add_filter( 'wc_order_statuses', __CLASS__ . '::add_pending_shipment_status' );
	}

	/**
	 * Dropp status column
	 *
	 * @param  array $columns Columns.
	 * @return array          Columns.
	 */
	public static function dropp_status_column( $columns ) {
		$columns['dropp_booking_count'] = __( 'Dropp', 'woocommerce-dropp-shipping' );
		return $columns;
	}

	/**
	 * Get booking column value
	 *
	 * @param string $column Column.
	 */
	public static function dropp_column_value( $column ) {
		global $the_order;

		if ( 'dropp_booking_count' === $column ) {
			$count = Dropp_Consignment::count_consignments_on_order( $the_order );
			echo esc_html( $count );
		}
	}

	/**
	 * Register awaiting shipment order status.
	 */
	public static function register_pending_shipment_order_status() {
		register_post_status(
			'wc-dropp-pending',
			array(
				'label'                     => __( 'Pending Shipment (Dropp)', 'woocommerce-dropp-shipping' ),
				'public'                    => true,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				/* translators: %s: Number of pending shipments */
				'label_count'         => _n_noop(
					'Pending shipment (Dropp)<span class="count">(%s)</span>',
					'Pending shipment (Dropp)<span class="count">(%s)</span>',
					'woocommerce-dropp-shipping'
				),
			)
		);
	}

	/**
	 * Add awaiting shipment to order statuses.
	 *
	 * @param array $order_statuses Order statuses.
	 * @return array
	 */
	public static function add_pending_shipment_status( $order_statuses ) {
		$new_order_statuses = [];

		// Add the order status after processing.
		foreach ( $order_statuses as $key => $status ) {
			$new_order_statuses[ $key ] = $status;
			if ( 'wc-processing' === $key ) {
				$new_order_statuses['wc-dropp-pending'] = __( 'Pending Shipment (Dropp)', 'woocommerce-dropp-shipping' );
			}
		}

		return $new_order_statuses;
	}
}
