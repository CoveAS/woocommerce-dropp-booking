<?php
/**
 * Home Delivery
 *
 * @package dropp-for-woocommerce
 */

namespace Dropp\Shipping_Method;

use Dropp\API;

/**
 * Home Delivery
 */
class Corporate_Home_Delivery extends Home_Delivery {

	/**
	 * Capital Area
	 *
	 * @var string One of 'inside', 'outside' or 'both'
	 */
	protected static $capital_area = 'inside';

	/**
	 * Constructor.
	 *
	 * @param int $instance_id Shipping method instance.
	 */
	public function __construct( $instance_id = 0 ) {
		$this->id                 = 'dropp_corporate';
		$this->instance_id        = absint( $instance_id );
		$this->method_title       = __( 'Dropp Corporate Home Delivery', 'dropp-for-woocommerce' );
		$this->method_description = __( 'Home delivery in Iceland', 'dropp-for-woocommerce' );
		$this->supports           = array(
			'shipping-zones',
			'instance-settings',
			'instance-settings-modal',
		);
		$this->init();
	}
}
