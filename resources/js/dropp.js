jQuery(function ($) {

	function block(selector) {
		$(selector).block({
			message: null,
			overlayCSS: {
				background: '#fff',
				opacity: 0.6
			}
		});
	};

	let locationSelected = _dropp.location_selected;
	let showingChooser = false;
	function choose(
		instance_id,
		locationError,
		immediate,
		callback,
		errorHandler
	) {
		// Check that the chooser function is defined
		if (typeof chooseDroppLocation === 'undefined') {
			// @TODO: Error handling for when the choose dropp location function does not exist
			console.error('Dropp location picker has not loaded yet!');
			return;
		}

		// Only show the chooser once at a time
		if (showingChooser) {
			return;
		}
		showingChooser = true;

		if (! errorHandler) {
			errorHandler = () => {
				$('.dropp-error').show().text(_dropp.i18n.error_loading);
			};
		}

		chooseDroppLocation()
			.then(function (location) {
				if (!location || !location.id) {
					// Something went wrong.
					locationError && locationError(location);
					return;
				}

				// Show the name.
				immediate && immediate(location);

				// A location was picked. Save it.
				$.post(
					_dropp.ajaxurl,
					{
						action: 'dropp_set_location',
						instance_id: instance_id,
						location_id: location.id,
						location_name: location.name,
						location_address: location.address,
						location_pricetype: location.pricetype,
					},
					callback
				);
			})
			.catch(errorHandler)
			.finally(() => showingChooser = false);
	}

	let externalJs = undefined;
	function addExternalJs() {
		// Check that the script hasn't already been added
		if (externalJs) {
			return externalJs;
		}
		// Add the script to the document
		externalJsAdded = true;
		externalJs = document.createElement('script');
		externalJs.src = _dropp.dropplocationsurl;
		externalJs.dataset.storeId = _dropp.storeid;
		setTimeout(() => document.body.appendChild(externalJs), 10);
		return externalJs;
	}

	function locationPickerClickHandler(instanceId) {
		choose(
			instanceId,
			(location) => console.error(location),
			(location) => {
				$('.dropp-location__name').text(location.name).show()
			},
			() => {
				// Ajax completed. Reload page to refresh the checkout
				window.location.reload();
			},
			(error) => console.error(error)
		);
	}

	function getOrCreatePicker(el, instanceId) {
		// Check that the radio control option exists
		if (! el.length) {
			return $();
		}

		// Location picker should be the next element
		let locationPicker = el.next();

		// Insert location picker when it doesn't exist yet
		if (! locationPicker.length || !locationPicker.hasClass('dropp-location')) {
			// Create new picker
			locationPicker = $(_dropp.location_picker);
			el.after(locationPicker);

			// Bind click handler
			locationPicker
				.find('.button')
				.on('click', (e) => {
					e.preventDefault();
					locationPickerClickHandler(instanceId);
				});
		}

		// Show the picker
		return locationPicker;
	}


	function getPackages() {
		if (!window.wc || !window.wp) {
			return [];
		}
		const storeKey = wc.wcBlocksData.CART_STORE_KEY;
		const store = wp.data.select(storeKey);
		return store.getShippingRates();
	}

	function getShippingRates() {
		const packages = getPackages();
		let shippingRates = [];
		for (let i = 0; i < packages.length; i++) {
			const rates = packages[i].shipping_rates;
			shippingRates = shippingRates.concat(rates);
		}
		return shippingRates;
	}

	function renderLocationPicker() {
		// Check if a supported shipping method has been selected
		const shippingRates = getShippingRates();
		const selectedShippingRates = shippingRates.filter((rate) => rate.selected);

		// Get rates that supports the location picker
		const rates = selectedShippingRates.filter(
			(rate) => rate.method_id === 'dropp_is' || rate.method_id === 'dropp_is_oca'
		);

		// No matching rates, return early
		if (! rates.length) {
			return;
		}

		for (let i = 0; i < rates.length; i++) {
			const rate = rates[i];
			// Select element based on single or multiple rate display mode
			const el = shippingRates.length === 1
				// When there is only 1 rate WooCommerce uses a label-group
				? $('.wc-block-components-shipping-rates-control .wc-block-components-radio-control__label-group')
				// For multiple rate display WooCommerce uses radio buttons
				: $('[value="' + rate.rate_id + '"]').closest('.wc-block-components-radio-control__option');

			if (! el.length) {
				return;
			}
			getOrCreatePicker(el, rate.instance_id).show();
		}
	}

	function selectShippingRateHandler(data) {
		// Hide location picker
		$('.dropp-location').hide();

		// Sanity check for shipping rate id
		if (!data.shippingRateId) {
			return;
		}

		// Check for dropp method that requires location picker
		const parts = data.shippingRateId.split(':');
		if (parts[0] !== 'dropp_is' && parts[0] !== 'dropp_is_oca') {
			return;
		}

		// Display the location picker button
		renderLocationPicker();
	}

	var checkoutBlock = document.querySelector('.wp-block-woocommerce-checkout')
	if (checkoutBlock) {
		// Gutenberg block checkout

		// WordPress object is required
		if (! window.wp || ! wp.hooks) {
			return;
		}
		// Add the external dropp location picker script
		addExternalJs();

		// Bind callback to the set-selected-shipping-rate action
		wp.hooks.addAction(
			'woocommerce_blocks-checkout-set-selected-shipping-rate',
			'dropp-for-woocommerce',
			selectShippingRateHandler
		);
		wp.hooks.addAction(
			'experimental__woocommerce_blocks-checkout-set-selected-shipping-rate',
			'dropp-for-woocommerce',
			selectShippingRateHandler
		);

		// Create an observer for the checkout block
		const observer = new MutationObserver(function(mutations) {
			// Render location picker with a small delay to let the shipping options block initialise
			setTimeout(renderLocationPicker, 250);
			observer.disconnect();
		});

		// Observe the checkout block for changes
		observer.observe(checkoutBlock, {subtree: true, childList: true});
	} else {
		// Classic checkout
		let loaded = false;
		block('#shipping_method');
		addExternalJs().onload = () => {
			showSelector();
			loaded = true;
		};
		$(document).on(
			'updated_checkout',
			() => loaded
				? showSelector()
				: block('#shipping_method')
		);
	}

	function locationClickHandler(e) {
		e.preventDefault();
		var form = $('form.checkout');
		let elem = $(this).closest('.dropp-location');
		let instance_id = elem.data('instance_id');

		// locationPickerClickHandler(instance_id)
		choose(
			instance_id,
			(location) => {
				// Closed location picker without selecting location
				console.error(location)
			},
			(location) => elem.find('.dropp-location__name').text(location.name).show(),
			() => form.trigger('update_checkout'),
			(error) => {
				$('.dropp-location .button').hide();
				$('.dropp-error').show();
				$('#shipping_method').unblock();
			}
		);
	}

	function showSelector() {
		$('.dropp-location').show();
		$('.dropp-error').hide();
		$('.dropp-location__button').on('click', locationClickHandler);
		$('#shipping_method').unblock();
	}

});
