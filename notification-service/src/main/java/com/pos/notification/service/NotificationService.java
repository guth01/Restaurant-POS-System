package com.pos.notification.service;

import com.pos.notification.dto.PaymentSuccessEvent;

public interface NotificationService {

    void sendReceiptEmail(PaymentSuccessEvent event);

}
